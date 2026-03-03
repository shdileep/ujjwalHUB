
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppState, Complaint, Message, Attachment, User as UserType } from '../../types';
import { databaseService } from '../../services/database.service';
import {
  Plus, Search, Paperclip, Send, Bold, Type, Sparkles,
  ChevronLeft, Star, Reply, Forward, X,
  Inbox, Send as SendIcon, Trash2, Mail,
  FileText, Loader2, Maximize2, ChevronDown, CheckCircle2, Undo2, ArrowLeft, Clock
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Mono', value: 'Roboto Mono, monospace' },
  { name: 'Playfair', value: 'Playfair Display, serif' },
  { name: 'Dancing', value: 'Dancing Script, cursive' },
  { name: 'Orbitron', value: 'Orbitron, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { name: 'Pacifico', value: 'Pacifico, cursive' },
  { name: 'Kanit', value: 'Kanit, sans-serif' }
];

const SUBJECT_ISSUES = [
  {
    category: 'Bin / Hub Node Issues',
    items: ['Broken Bin', 'Overflow', 'Collapsed Bin', 'Missing Bin', 'Hub Damage']
  },
  {
    category: 'Vehicle-Related Issues',
    items: ['Engine Issue', 'GPS Fault', 'Fuel Problem', 'Tyre Damage']
  },
  {
    category: 'Ujjwal App Issues',
    items: ['Login Error', 'App Crash', 'Sync Failed', 'Map Not Loading']
  }
];

const AIMessageContent: React.FC<{ msg: Message }> = ({ msg }) => {
  const content = msg.content;
  const style = {
    fontFamily: msg.fontFamily || 'inherit',
    fontWeight: msg.isBold ? 'bold' : 'normal'
  };

  if (!content.includes('[DEAR]')) {
    return <p className="text-sm md:text-base leading-relaxed whitespace-pre-line text-slate-700" style={style}>{content}</p>;
  }

  const dear = content.match(/\[DEAR\](.*?)\[\/DEAR\]/s)?.[1] || "";
  const mainText = content.split('[/DEAR]')[1]?.split('[ADMIN_BLOCK]')[0]?.trim() || "";
  const adminBlock = content.match(/\[ADMIN_BLOCK\](.*?)\[\/ADMIN_BLOCK\]/s)?.[1] || "";
  const caution = content.match(/\[CAUTION\](.*?)\[\/CAUTION\]/s)?.[1] || "";
  const notices = content.match(/\[NOTICES\](.*?)\[\/NOTICES\]/s)?.[1] || "";

  return (
    <div className="space-y-4 md:space-y-6" style={style}>
      <p className="text-base font-black text-slate-900">{dear}</p>
      <p className="text-sm md:text-base leading-relaxed text-slate-700 whitespace-pre-line">{mainText}</p>

      <div className="pt-6 border-t border-slate-100">
        <p className="text-sm font-black text-slate-900 whitespace-pre-line leading-relaxed italic">{adminBlock.trim()}</p>
      </div>

      <div className="space-y-4 pt-4">
        <p className="text-xs md:text-sm font-black text-red-600 uppercase tracking-tight">{caution}</p>
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
          <p className="text-[10px] md:text-xs leading-relaxed whitespace-pre-line text-sky-600 font-black">
            {notices.trim()}
          </p>
        </div>
      </div>
    </div>
  );
};

const AttachmentThumbnail: React.FC<{ attachment: Attachment; onClick: () => void }> = ({ attachment, onClick }) => {
  const isImage = attachment.type.startsWith('image/');
  return (
    <div
      onClick={onClick}
      className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center shrink-0 shadow-sm"
    >
      {isImage ? (
        <img src={attachment.data} alt={attachment.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 p-1">
          <FileText size={24} className="text-slate-400" />
          <span className="text-[7px] font-black text-slate-500 truncate w-full text-center px-1 uppercase">{attachment.name.split('.').pop()}</span>
        </div>
      )}
    </div>
  );
};

interface ComposerProps {
  onCancel: () => void;
  type?: 'new' | 'reply' | 'forward';
  onSend: (data: { subject: string, content: string, attachments: Attachment[], fontFamily: string, isBold: boolean, receiver: string }) => void;
  initialSubject?: string;
  initialContent?: string;
  initialReceiver?: string;
  user: UserType;
}

/**
 * COMPOSER COMPONENT
 * Defined outside the main render cycle to ensure persistent focus during typing.
 */
const ComposerComponent: React.FC<ComposerProps> = ({ onCancel, type = 'new', onSend, initialSubject = '', initialContent = '', initialReceiver = 'admin@ujjwalhub.ac.in', user }) => {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [isBold, setIsBold] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleAiEnhance = async (target: 'subject' | 'body') => {
    const textToEnhance = target === 'subject' ? subject : content;
    if (!textToEnhance.trim()) return;

    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an expert municipal administrative editor. Correct grammar, spelling, and enhance clarity for this field report ${target}. Be professional and extremely concise. Output ONLY the corrected text without any introductory remarks, quotes, or commentary. Input: "${textToEnhance}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      if (response.text) {
        if (target === 'subject') setSubject(response.text.trim());
        else setContent(response.text.trim());
      }
    } catch (error) {
      console.error("AI enhancement failed", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments(prev => [...prev, { name: file.name, type: file.type, data: base64 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const constructFullContent = () => {
    if (type !== 'new') return content;

    return `Dear Admin Team,

${content}

Kindly check and resolve it at the earliest.

Please look into this issue ASAP.
Thanks for your support.

Regards,
${user.username}
Driver ID: ${user.employeeId}
Email ID: ${user.email}
Phone: ${user.phone}`;
  };

  const handleSend = () => {
    onSend({
      subject,
      content: constructFullContent(),
      attachments,
      fontFamily: selectedFont,
      isBold,
      receiver: initialReceiver
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* RECIPIENT FIELD */}
        <div className="relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Receiver (To)</label>
          <input
            type="text"
            readOnly
            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-3xl font-black text-slate-900 outline-none cursor-not-allowed opacity-80"
            value={initialReceiver}
          />
        </div>

        {/* SUBJECT FIELD */}
        <div className="relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Subject</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Select issue or type subject..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-slate-800 focus:ring-4 focus:ring-emerald-50"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                onFocus={() => setIsSubjectDropdownOpen(true)}
              />
              {isSubjectDropdownOpen && type === 'new' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl z-[1100] max-h-60 overflow-y-auto rounded-[2.5rem] overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Predefined Dispatches</span>
                    <button onClick={() => setIsSubjectDropdownOpen(false)}><X size={14} className="text-slate-300" /></button>
                  </div>
                  {SUBJECT_ISSUES.map(cat => (
                    <div key={cat.category}>
                      <div className="px-5 py-2 bg-slate-50/50 text-[8px] font-black text-indigo-600 uppercase tracking-widest">{cat.category}</div>
                      {cat.items.map(item => (
                        <button key={item} onClick={() => { setSubject(item); setIsSubjectDropdownOpen(false); }} className="w-full px-6 py-4 text-left text-xs font-bold hover:bg-emerald-50 border-b border-slate-50 last:border-0">{item}</button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleAiEnhance('subject')}
              disabled={isAiProcessing}
              title="AI Subject Enhancement"
              className="p-4 bg-white border border-slate-100 rounded-3xl text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
            >
              {isAiProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* RICH BODY EDITOR */}
      <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-inner flex flex-col min-h-[400px]">
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="p-2.5 hover:bg-slate-50 text-slate-500 rounded-2xl transition-all flex items-center gap-2 border border-slate-100">
                <Type size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{FONT_OPTIONS.find(f => f.value === selectedFont)?.name}</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white shadow-2xl border border-slate-100 hidden group-hover:block z-50 py-3 min-w-[160px] rounded-[1.75rem]">
                {FONT_OPTIONS.map(font => (
                  <button key={font.name} onClick={() => setSelectedFont(font.value)} className="w-full px-5 py-3 hover:bg-slate-50 text-left text-xs font-bold transition-all" style={{ fontFamily: font.value }}>{font.name}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setIsBold(!isBold)} className={`p-2.5 rounded-2xl transition-all border ${isBold ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'text-slate-400 bg-white border-slate-100 hover:bg-slate-50'}`}>
              <Bold size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100">
              <Paperclip size={18} />
            </button>
          </div>
          <button onClick={() => handleAiEnhance('body')} disabled={isAiProcessing} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Enhance
          </button>
        </div>

        <div className="flex-1 p-8 flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
          {type === 'new' && (
            <div className="mb-4">
              <span className="text-base font-black text-slate-900">Dear Admin Team,</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            style={{ fontFamily: selectedFont, fontWeight: isBold ? 'bold' : 'normal' }}
            className="flex-1 bg-transparent outline-none resize-none font-medium text-slate-700 leading-relaxed text-base min-h-[150px]"
            placeholder="Type your issue here..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {type === 'new' && (
            <div className="mt-6 pt-6 border-t border-slate-100 select-none pointer-events-none opacity-60">
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Kindly check and resolve it at the earliest.<br /><br />
                Please look into this issue ASAP.<br />
                Thanks for your support.<br /><br />
                Regards,<br />
                <span className="font-black text-slate-800">{user.username}</span><br />
                Driver ID: {user.employeeId}<br />
                Email ID: {user.email}<br />
                Phone: {user.phone}
              </p>
            </div>
          )}
        </div>

        {/* THUMBNAILS GRID */}
        {attachments.length > 0 && (
          <div className="p-6 bg-white/50 border-t border-slate-100 flex gap-4 overflow-x-auto no-scrollbar">
            {attachments.map((file, i) => (
              <div key={i} className="relative shrink-0">
                <AttachmentThumbnail attachment={file} onClick={() => { }} />
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg border-2 border-white hover:bg-red-600 transition-colors"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onCancel} className="px-8 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-slate-900 transition-all">Discard Changes</button>
        <button
          onClick={handleSend}
          disabled={!content.trim() || (type === 'new' && !subject.trim())}
          className="flex items-center gap-4 px-12 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <SendIcon size={18} /> {type === 'reply' ? 'Post Reply' : type === 'forward' ? 'Finalize Forward' : 'Send Email'}
        </button>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
    </div>
  );
};

export const DriverComplaints: React.FC<Props> = ({ state, updateState }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred' | 'trash'>('inbox');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedEmail, setSelectedEmail] = useState<Complaint | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<Complaint | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const user = state.user!;

  const filteredMails = useMemo(() => {
    return (state.complaints || []).filter(c => {
      const messages = c.messages || [];
      const involvingBroadcast = messages.some(m => (m.receiverEmail || '').toLowerCase() === 'all-drivers@ujjwalhub.ac.in');
      const areaMatchesBroadcast = !c.targetArea || (user.location || '').toLowerCase() === c.targetArea.toLowerCase();

      const involvesMe = messages.some(m =>
        (m.senderEmail || '').toLowerCase() === user.email.toLowerCase() ||
        (m.receiverEmail || '').toLowerCase() === user.email.toLowerCase() ||
        (m.receiverEmail || '').toLowerCase() === 'admin@ujjwalhub.ac.in'
      ) || (involvingBroadcast && areaMatchesBroadcast);

      if (!involvesMe) return false;
      if (activeTab === 'trash') return c.isDeletedByDriver;
      if (c.isDeletedByDriver) return false;
      if (activeTab === 'starred') return c.isStarredByDriver;
      if (activeTab === 'sent') return messages[0]?.senderEmail === user.email;
      if (activeTab === 'inbox') return messages.some(m => m.senderEmail === 'admin@ujjwalhub.ac.in');
      return true;
    });
  }, [state.complaints, activeTab, user.email]);

  const handleOpenMail = (mail: Complaint) => {
    setSelectedEmail(mail);
    setView('detail');
    setIsReplyOpen(false);
    setIsForwardOpen(false);
    if (mail.status === 'Unread') {
      updateState({ complaints: state.complaints.map(c => c.id === mail.id ? { ...c, status: 'Seen' as const } : c) });
    }
  };

  const handleUndoDelete = () => {
    if (lastDeleted) {
      const updates = { isDeletedByDriver: false };
      updateState({ complaints: state.complaints.map(c => c.id === lastDeleted.id ? { ...c, ...updates } : c) });
      databaseService.updateComplaint(lastDeleted.id, updates);
      setLastDeleted(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, mail: Complaint) => {
    e.stopPropagation();
    setLastDeleted(mail);
    const updates = { isDeletedByDriver: true };
    updateState({ complaints: state.complaints.map(c => c.id === mail.id ? { ...c, ...updates } : c) });
    if (selectedEmail?.id === mail.id) setView('list');
    databaseService.updateComplaint(mail.id, updates);
  };

  const handleStar = (e: React.MouseEvent, mail: Complaint) => {
    e.stopPropagation();
    const updates = { isStarredByDriver: !mail.isStarredByDriver };
    updateState({ complaints: state.complaints.map(c => c.id === mail.id ? { ...c, ...updates } : c) });
    databaseService.updateComplaint(mail.id, updates);
  };

  const onSendDispatch = (data: { subject: string, content: string, attachments: Attachment[], fontFamily: string, isBold: boolean, receiver: string }) => {
    const timestamp = new Date().toLocaleString();
    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderName: user.username,
      senderEmail: user.email,
      receiverEmail: data.receiver,
      content: data.content,
      timestamp,
      attachments: data.attachments,
      fontFamily: data.fontFamily,
      isBold: data.isBold
    };

    if (isReplyOpen && selectedEmail) {
      // Update existing complaint
      const updatedMessages = [...selectedEmail.messages, newMsg];
      const updates = {
        messages: updatedMessages,
        lastUpdated: timestamp,
        status: 'Replied' as const
      };

      // Optimistic update
      const updatedComplaints = state.complaints.map(c => c.id === selectedEmail.id ? { ...c, ...updates } : c);
      updateState({ complaints: updatedComplaints });
      setSelectedEmail({ ...selectedEmail, ...updates });

      // Persist to Firebase
      databaseService.updateComplaint(selectedEmail.id, updates);

    } else if (isForwardOpen && selectedEmail) {
      // Forward logic (similar to reply but maybe new thread? No, usually same thread or new?)
      // Current logic appended to same thread. I'll keep it consistent.
      const updatedMessages = [...selectedEmail.messages, newMsg];
      const updates = {
        messages: updatedMessages,
        lastUpdated: timestamp,
        status: 'Replied' as const
      };

      const updatedComplaints = state.complaints.map(c => c.id === selectedEmail.id ? { ...c, ...updates } : c);
      updateState({ complaints: updatedComplaints });
      setSelectedEmail({ ...selectedEmail, ...updates });

      databaseService.updateComplaint(selectedEmail.id, updates);

    } else {
      // New Complaint
      const newComplaint: Complaint = {
        id: `CMP-${Date.now()}`, // This ID might be overwritten if utilizing push keys, but for now we send it.
        // Actually, looking at database.service, createComplaint ignores the ID in the object and uses push key? 
        // No, it saves the whole object. But getAllComplaints overwrites 'id' with key. 
        // So we should let Firebase handle ID if possible, but here we can just send it.
        threadId: `T-${Date.now()}`,
        subject: data.subject,
        messages: [newMsg],
        isStarredByAdmin: false,
        isStarredByDriver: false,
        isDeletedByAdmin: false,
        isDeletedByDriver: false,
        isAiRepliedByAdmin: false,
        lastUpdated: timestamp,
        status: 'Unread'
      };

      // Optimistic Update
      updateState({ complaints: [newComplaint, ...(state.complaints || [])] });

      // Persist to Firebase
      // We pass newComplaint, but we might want to capture the real key if we needed it immediately.
      // But for now just firing and forgetting is fine for this sync.
      databaseService.createComplaint(newComplaint);
    }

    setIsComposeOpen(false);
    setIsReplyOpen(false);
    setIsForwardOpen(false);
  };

  const generateForwardContent = (complaint: Complaint) => {
    let text = "\n\n---------- Forwarded message ----------\n";
    text += `From: ${complaint.messages[0].senderName} <${complaint.messages[0].senderEmail}>\n`;
    text += `Date: ${complaint.messages[0].timestamp}\n`;
    text += `Subject: ${complaint.subject}\n\n`;
    text += complaint.messages.map(m => `[${m.senderName} @ ${m.timestamp}]:\n${m.content}`).join("\n\n---\n\n");
    return text;
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white md:rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative transition-all duration-500">
      {/* UNDO NOTIFICATION */}
      {lastDeleted && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1500] animate-in slide-in-from-bottom-10">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-400" />
              <p className="text-sm font-bold">Mail thread archived.</p>
            </div>
            <button onClick={handleUndoDelete} className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:underline">
              <Undo2 size={16} /> Undo
            </button>
          </div>
        </div>
      )}

      {view === 'list' ? (
        <>
          {/* TABS HEADER */}
          <div className="px-4 md:px-10 py-5 border-b border-slate-50 bg-white flex items-center justify-start md:justify-center gap-4 md:gap-12 z-20 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'inbox', icon: Inbox, label: 'Inbox' },
              { id: 'sent', icon: SendIcon, label: 'Sent' },
              { id: 'starred', icon: Star, label: 'Starred' },
              { id: 'trash', icon: Trash2, label: 'Trash' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1 px-5 py-2 transition-all shrink-0 rounded-2xl ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300 hover:bg-slate-50'}`}>
                <tab.icon size={22} className={activeTab === tab.id ? 'fill-emerald-50/50' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* LIST TITLE & NEW BUTTON */}
          <div className="px-8 md:px-16 py-8 flex items-center justify-between border-b border-slate-50 bg-slate-50/20 shrink-0 gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab} Node</h2>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Official Communication v3.9</p>
            </div>
            <button onClick={() => setIsComposeOpen(true)} className="flex items-center justify-center gap-3 px-10 py-4.5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 group">
              <Mail size={20} className="transition-transform group-hover:scale-110" /> Email
            </button>
          </div>

          {/* LIST VIEW SCROLL AREA */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="divide-y divide-slate-50">
              {filteredMails.length > 0 ? filteredMails.map((mail) => (
                <div key={mail.id} onClick={() => handleOpenMail(mail)} className={`flex flex-col md:flex-row md:items-center gap-6 md:gap-12 px-8 md:px-16 py-8 md:py-10 hover:bg-slate-50/50 cursor-pointer transition-all border-l-[12px] group ${mail.status === 'Unread' ? 'border-emerald-500 bg-emerald-50/5' : 'border-transparent opacity-75'}`}>
                  <div className="flex items-center gap-8 flex-1 min-w-0">
                    <Star size={24} onClick={(e) => handleStar(e, mail)} className={`shrink-0 transition-all hover:scale-125 ${mail.isStarredByDriver ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-lg font-black text-slate-900 truncate uppercase tracking-tight leading-none">{mail.subject}</p>
                        {mail.status === 'Unread' && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} className="text-slate-300" /> Synchronized: {mail.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-10 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${mail.status === 'Unread' ? 'text-red-500 border-red-100 bg-red-50' : 'text-blue-600 border-blue-100 bg-blue-50'
                      }`}>{mail.status}</div>
                    <button onClick={(e) => handleDelete(e, mail)} className="p-3 bg-white shadow-md rounded-2xl text-slate-300 hover:text-red-500 hover:shadow-xl transition-all active:scale-90"><Trash2 size={20} /></button>
                  </div>
                </div>
              )) : (
                <div className="py-48 text-center opacity-10 flex flex-col items-center justify-center grayscale">
                  <Inbox size={100} className="mb-8" />
                  <p className="text-xl font-black uppercase tracking-[0.6em]">No Active Logs</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* DETAIL VIEW (IN-PAGE) */
        selectedEmail && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
            <div className="px-8 md:px-16 py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 shadow-sm z-10">
              <button onClick={() => setView('list')} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-black uppercase text-xs tracking-widest transition-all active:scale-95 group">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowLeft size={18} /></div>
                Back to Hub
              </button>
              <div className="text-right flex flex-col items-end">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 leading-none">Official Digital Thread</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Ref: #{selectedEmail.id}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-20 space-y-16 bg-slate-50/20">
              <div className="border-b-2 border-slate-100 pb-12">
                <div className="inline-block px-4 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest mb-6 shadow-lg">Public Archive • Secure Node</div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight max-w-4xl">{selectedEmail.subject}</h1>
              </div>

              {/* THREADED MESSAGES - Chronological Order */}
              <div className="space-y-12">
                {selectedEmail.messages.map((msg, i) => (
                  <div key={i} className={`bg-white p-10 md:p-14 rounded-[3.5rem] border shadow-sm relative transition-all group hover:shadow-2xl ${msg.senderEmail === user.email ? 'border-emerald-100 ring-8 ring-emerald-50/20' : 'border-slate-50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center font-black text-2xl shadow-inner ${msg.senderEmail === user.email ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                          {msg.senderName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{msg.senderName}</p>
                          <p className="text-[11px] font-bold text-slate-300 italic tracking-widest uppercase">{msg.senderEmail}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-200 tracking-[0.2em] uppercase leading-none">{msg.timestamp}</span>
                        <div className="mt-2 px-3 py-0.5 bg-slate-50 rounded-full text-[8px] font-black text-slate-300 uppercase tracking-widest border border-slate-100">Synchronized Node</div>
                      </div>
                    </div>

                    <AIMessageContent msg={msg} />

                    {msg.attachments.length > 0 && (
                      <div className="mt-12 pt-10 border-t border-slate-50 space-y-6">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                          <Paperclip size={16} className="text-emerald-500" /> Digital Archive Assets ({msg.attachments.length})
                        </p>
                        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                          {msg.attachments.map((file, idx) => (
                            <AttachmentThumbnail key={idx} attachment={file} onClick={() => setPreviewAttachment(file)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ACTION CONTROLS - REFINED TEXT BUTTONS */}
              <div className="flex items-center justify-center gap-12 pt-10 border-t-2 border-slate-100 animate-in fade-in duration-700">
                <button
                  onClick={() => { setIsReplyOpen(!isReplyOpen); setIsForwardOpen(false); }}
                  className={`flex items-center gap-4 font-black uppercase text-xs tracking-[0.3em] transition-all group ${isReplyOpen ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                >
                  <Reply size={22} className={`group-hover:-translate-x-1 transition-transform ${isReplyOpen ? 'text-emerald-600' : 'text-slate-200'}`} />
                  Reply
                </button>
                <button
                  onClick={() => { setIsForwardOpen(!isForwardOpen); setIsReplyOpen(false); }}
                  className={`flex items-center gap-4 font-black uppercase text-xs tracking-[0.3em] transition-all group ${isForwardOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Forward size={22} className={`group-hover:translate-x-1 transition-transform ${isForwardOpen ? 'text-indigo-600' : 'text-slate-200'}`} />
                  Forward
                </button>
              </div>

              {/* INLINE EDITORS - APPEAR BELOW THREAD */}
              {(isReplyOpen || isForwardOpen) && (
                <div className="animate-in slide-in-from-top-12 duration-700 p-10 md:p-16 bg-white border-[6px] border-slate-50 rounded-[4rem] shadow-2xl mt-12 mb-20">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl shadow-lg ${isReplyOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isReplyOpen ? <Reply size={28} /> : <Forward size={28} />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-widest leading-none mb-1">
                          {isReplyOpen ? 'Drafting Inline Reply' : 'Forwarding Thread Content'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrative Grid Relay Node</p>
                      </div>
                    </div>
                    <button onClick={() => { setIsReplyOpen(false); setIsForwardOpen(false); }} className="p-3 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"><X size={28} /></button>
                  </div>
                  <ComposerComponent
                    type={isReplyOpen ? "reply" : "forward"}
                    onCancel={() => { setIsReplyOpen(false); setIsForwardOpen(false); }}
                    onSend={onSendDispatch}
                    initialSubject={isReplyOpen ? `Re: ${selectedEmail.subject}` : `Fwd: ${selectedEmail.subject}`}
                    initialContent={isForwardOpen ? generateForwardContent(selectedEmail) : ''}
                    user={user}
                  />
                </div>
              )}

              {/* SCROLL SPACER */}
              <div className="h-20"></div>
            </div>
          </div>
        )
      )}

      {/* NEW EMAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-white rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.6)] border-8 border-white overflow-hidden animate-in slide-in-from-bottom-24 duration-700 flex flex-col max-h-[94vh]">
            <div className="bg-slate-900 px-12 py-12 text-white flex items-center justify-between shrink-0 shadow-2xl relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-emerald-500 animate-in zoom-in-50 duration-700">
                  <Mail size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-[0.3em] leading-none mb-2">New Administrative Email</h3>
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.4em]">Official Communication Node</p>
                </div>
              </div>
              <button onClick={() => setIsComposeOpen(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all active:scale-90"><X size={36} /></button>
            </div>
            <div className="p-10 md:p-16 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <ComposerComponent user={user} onCancel={() => setIsComposeOpen(false)} onSend={onSendDispatch} />
            </div>
          </div>
        </div>
      )}

      {/* ASSET PREVIEW LAYER */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 md:p-24 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <button onClick={() => setPreviewAttachment(null)} className="absolute top-12 right-12 p-6 bg-white/10 text-white rounded-3xl hover:bg-white/20 transition-all active:scale-90 shadow-2xl z-50"><X size={48} /></button>
          <div className="w-full h-full flex flex-col items-center justify-center gap-12 max-w-7xl mx-auto">
            {previewAttachment.type.startsWith('image/') ? (
              <img src={previewAttachment.data} alt={previewAttachment.name} className="max-w-full max-h-full object-contain shadow-[0_0_120px_rgba(16,185,129,0.3)] rounded-[3rem] border-8 border-white/5 animate-in zoom-in-95 duration-500" />
            ) : (
              <div className="bg-white p-20 rounded-[5rem] text-center shadow-2xl max-w-2xl w-full border-t-[16px] border-emerald-600 animate-in slide-in-from-bottom-12 duration-500">
                <div className="w-32 h-32 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 shadow-inner"><FileText size={80} /></div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-tight">{previewAttachment.name}</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] mb-16">Digital Archive Vault • Secure Access Only</p>
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewAttachment.data;
                  link.download = previewAttachment.name;
                  link.click();
                }} className="w-full py-8 bg-slate-900 text-white rounded-[2.25rem] font-black uppercase tracking-[0.4em] text-sm shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] active:scale-95 transition-all hover:bg-emerald-600">Download Dispatch Asset</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
