
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Complaint, Message, Attachment, DriverProfile, User as UserType } from '../../types';
import {
  Inbox, Search, ChevronLeft, Star, Reply, Forward,
  Trash2, X, FileText, Send, Bold, Type, Sparkles,
  Mail, Loader2, Maximize2, ShieldCheck, Cpu, User,
  ChevronDown, CheckCircle2, Paperclip, Undo2, RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { databaseService } from '../../services/database.service';

interface Props {
  complaints: Complaint[];
  onUpdate: (complaints: Complaint[]) => void;
  drivers: DriverProfile[];
  adminUser: UserType;
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

const AI_REPLY_CONTENT = (driverName: string, adminName: string) => `[DEAR]Dear ${driverName},[/DEAR]

Your message has been successfully received by the Ujjwal Admin Team and is now under review. We truly value your effort and commitment toward Ujjwal HUB, and we assure you that we will resolve your issue as soon as possible. Our team is carefully analyzing your concern to provide an accurate and timely response. If you have any emergency-related issues, please immediately visit the Chennai Municipal Office for direct assistance. Thank you for your patience and continued support in helping us maintain smooth and safe operations.

[ADMIN_BLOCK]
${adminName}
Central Operations Manager
Admin Team of Ujjwal HUB
Government of Tamil Nadu, Chennai
Act, 1949
[/ADMIN_BLOCK]

[CAUTION]Ujjwal HUB – Caution & System Notices[/CAUTION]

[NOTICES]
• This message is system-generated for acknowledgement purposes and does not represent a final administrative decision.
• Do not share sensitive personal details, passwords, or OTPs through the complaint or messaging system.
• All communications are logged and monitored for service improvement and operational security.
• Misuse of the platform or submission of false information may lead to account restrictions under Ujjwal HUB policies.
• For critical safety or legal emergencies, always approach the nearest municipal or government authority directly.
[/NOTICES]`;

const OfficialSealedStamp = () => (
  <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center select-none opacity-85 hover:opacity-100 transition-opacity">
    <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-12 drop-shadow-md">
      <defs>
        <path id="stampOuterPath" d="M 120, 120 m -95, 0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" />
        <path id="stampInnerPath" d="M 120, 120 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
      </defs>
      <circle cx="120" cy="120" r="115" fill="none" stroke="#4f46e5" strokeWidth="4" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4 2" />
      <text fill="#4f46e5" className="text-[14px] font-black tracking-[0.2em] uppercase">
        <textPath xlinkHref="#stampOuterPath" startOffset="0%">
          UJJWAL HUB • URBAN INFRASTRUCTURE & SANITATION • GOVERNMENT OF TAMIL NADU •
        </textPath>
      </text>
      <circle cx="120" cy="120" r="78" fill="none" stroke="#4f46e5" strokeWidth="2" />
      <text fill="#4f46e5" className="text-[10px] font-bold tracking-widest uppercase">
        <textPath xlinkHref="#stampInnerPath" startOffset="50%" textAnchor="middle">
          MUNICIPAL CORPORATION AUTH • ACT 1949
        </textPath>
      </text>
      <g transform="translate(120, 120)">
        {[...Array(12)].map((_, i) => (
          <line key={i} x1="0" y1="-35" x2="0" y2="-45" stroke="#4f46e5" strokeWidth="1.5" transform={`rotate(${i * 30})`} opacity="0.4" />
        ))}
        <path d="M-25,-30 L25,-30 L25,5 C25,20 0,35 0,35 C0,35 -25,20 -25,5 Z" fill="white" stroke="#4f46e5" strokeWidth="2" />
        <path d="M-12,-15 L-12,5 C-12,12 0,18 0,18 C0,18 12,12 12,5 L12,-15" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
        <rect x="-12" y="-18" width="24" height="6" rx="1" fill="#4f46e5" />
        <path d="M-35,10 Q-45,25 -30,40 M35,10 Q45,25 30,40" fill="none" stroke="#4f46e5" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <text y="55" textAnchor="middle" fill="#4f46e5" className="text-[8px] font-black uppercase tracking-[0.3em]">ESTD 2026</text>
      </g>
    </svg>
  </div>
);

const AIMessageContent: React.FC<{ content: string; fontFamily?: string; isBold?: boolean }> = ({ content, fontFamily, isBold }) => {
  const baseStyle = { fontFamily: fontFamily || 'inherit', fontWeight: isBold ? 'bold' : 'normal' };

  if (!content.includes('[DEAR]')) {
    return <p className="text-sm md:text-base leading-relaxed whitespace-pre-line text-slate-700" style={baseStyle}>{content}</p>;
  }

  const dear = content.match(/\[DEAR\](.*?)\[\/DEAR\]/s)?.[1] || "";
  const mainText = content.split('[/DEAR]')[1]?.split('[ADMIN_BLOCK]')[0]?.trim() || "";
  const adminBlock = content.match(/\[ADMIN_BLOCK\](.*?)\[\/ADMIN_BLOCK\]/s)?.[1] || "";
  const caution = content.match(/\[CAUTION\](.*?)\[\/CAUTION\]/s)?.[1] || "";
  const notices = content.match(/\[NOTICES\](.*?)\[\/NOTICES\]/s)?.[1] || "";

  return (
    <div className="space-y-6" style={baseStyle}>
      <p className="text-base font-black text-slate-900">{dear}</p>
      <p className="text-sm md:text-base leading-relaxed text-slate-700 whitespace-pre-line">{mainText}</p>
      <div className="pt-6 border-t border-slate-100">
        <p className="text-sm font-black text-slate-900 whitespace-pre-line leading-relaxed italic">{adminBlock.trim()}</p>
      </div>
      <div className="space-y-4 pt-4">
        <p className="text-xs md:text-sm font-black text-red-600 uppercase tracking-tight">{caution}</p>
        <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100 shadow-inner">
          <p className="text-[11px] md:text-xs leading-relaxed whitespace-pre-line text-sky-600 font-black">
            {notices.trim()}
          </p>
        </div>
      </div>
      <div className="flex justify-end pt-4 pb-4">
        <OfficialSealedStamp />
      </div>
    </div>
  );
};

const AttachmentThumbnail: React.FC<{ attachment: Attachment; onClick: () => void }> = ({ attachment, onClick }) => {
  const isImage = attachment.type.startsWith('image/');
  return (
    <div
      onClick={onClick}
      className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-4 hover:ring-indigo-100 transition-all flex items-center justify-center shrink-0"
    >
      {isImage ? (
        <img src={attachment.data} alt={attachment.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 p-1">
          <FileText size={20} className="text-slate-400" />
          <span className="text-[7px] font-black text-slate-500 truncate w-full text-center px-1 uppercase">{attachment.name.split('.').pop()}</span>
        </div>
      )}
    </div>
  );
};

interface ComposerProps {
  type: 'new' | 'reply' | 'forward';
  onCancel: () => void;
  onSend: (data: { receiver: string, subject: string, content: string, attachments: Attachment[], font: string, bold: boolean }) => void;
  drivers: DriverProfile[];
  initialTo?: string;
  initialSubject?: string;
  initialContent?: string;
  adminUser: UserType;
  driverLocations: Record<string, string>;
}

const ComposerComponent: React.FC<ComposerProps> = ({ type, onCancel, onSend, drivers, initialTo = '', initialSubject = '', initialContent = '', adminUser, driverLocations }) => {
  const [to, setTo] = useState(initialTo);
  const [toSearch, setToSearch] = useState('');
  const [isToOpen, setIsToOpen] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [font, setFont] = useState(FONT_OPTIONS[0].value);
  const [bold, setBold] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handleAiEnhance = async (target: 'subject' | 'body') => {
    const text = target === 'subject' ? subject : content;
    if (!text.trim()) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an expert municipal administrative editor. Correct grammar, spelling, and refine tone for this ${target}. Be professional and extremely concise. Output ONLY the corrected text without any introductory remarks, quotes, or commentary. Input: "${text}"`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      if (response.text) {
        if (target === 'subject') setSubject(response.text.trim());
        else setContent(response.text.trim());
      }
    } catch (e) { console.error(e); }
    finally { setIsAiProcessing(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { alert("File exceeds 10MB"); return; }
      const r = new FileReader();
      r.onload = (ev) => setAttachments(prev => [...prev, { name: file.name, type: file.type, data: ev.target?.result as string }]);
      r.readAsDataURL(file);
    });
  };

  const filteredDrivers = useMemo(() => {
    const s = (toSearch || '').toLowerCase();
    const adminLoc = (adminUser.location || '').toLowerCase();

    const matchedAreaDrivers = (drivers || []).filter(d => {
      const dId = ((d as any).employeeId || d.driverId || '').toLowerCase();
      const dLoc = (d.location || (driverLocations && driverLocations[dId]) || '').toLowerCase();

      if (!adminLoc || adminLoc === 'all' || adminLoc === 'total' || adminLoc === 'chennai') return true;
      return dLoc === adminLoc || dLoc.includes(adminLoc) || adminLoc.includes(dLoc);
    });

    const list = matchedAreaDrivers.filter(d =>
      (d.username || '').toLowerCase().includes(s) ||
      (d.email || '').toLowerCase().includes(s)
    );
    const showGeneral = "general".includes(s);
    return { list, showGeneral };
  }, [drivers, toSearch, adminUser.location, driverLocations]);

  return (
    <div className="space-y-6">
      {(type === 'new' || type === 'forward') && (
        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Receiver (To)</label>
            <div onClick={() => setIsToOpen(true)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all">
              <span className={to ? "text-sm font-black text-slate-900" : "text-sm font-medium text-slate-400"}>
                {to === 'all-drivers@ujjwalhub.ac.in' ? 'General Broadcast' : (to || 'Select recipient...')}
              </span>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
            {isToOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[1000] overflow-hidden animate-in slide-in-from-top-2">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <Search size={14} className="text-slate-300" />
                  <input autoFocus type="text" placeholder="Search driver or type email..." className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700" value={toSearch} onChange={e => setToSearch(e.target.value)} />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredDrivers.showGeneral && (
                    <button onClick={() => { setTo('all-drivers@ujjwalhub.ac.in'); setIsToOpen(false); }} className="w-full px-6 py-4 hover:bg-indigo-50 text-left flex items-center gap-3 border-b border-slate-50">
                      <Inbox size={14} className="text-indigo-600" />
                      <div><p className="text-xs font-black text-slate-900">General</p><p className="text-[8px] font-bold text-slate-400">Broadcast to all field units</p></div>
                    </button>
                  )}
                  {filteredDrivers.list.map(d => (
                    <button key={d.driverId} onClick={() => { setTo(d.email); setIsToOpen(false); }} className="w-full px-6 py-4 hover:bg-slate-50 text-left border-b border-slate-50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {d.profilePhoto ? <img src={d.profilePhoto} className="w-full h-full object-cover" /> : <User size={14} className="text-slate-400" />}
                      </div>
                      <div><p className="text-xs font-black text-slate-900">{d.username}</p><p className="text-[8px] font-bold text-slate-400">{d.email}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Subject</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Dispatch subject..." className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:ring-4 focus:ring-indigo-100 transition-all" value={subject} onChange={e => setSubject(e.target.value)} />
              <button onClick={() => handleAiEnhance('subject')} disabled={isAiProcessing} className="p-4 bg-white border border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all">
                {isAiProcessing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[300px]">
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="p-2.5 hover:bg-slate-50 text-slate-500 rounded-xl transition-all flex items-center gap-2">
                <Type size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{FONT_OPTIONS.find(f => f.value === font)?.name}</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 hidden group-hover:block z-50 py-2 min-w-[140px]">
                {FONT_OPTIONS.map(f => (
                  <button key={f.name} onClick={() => setFont(f.value)} className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-bold transition-all" style={{ fontFamily: f.value }}>{f.name}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setBold(!bold)} className={`p-2.5 rounded-xl transition-all ${bold ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Bold size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Paperclip size={18} />
            </button>
          </div>
          <button onClick={() => handleAiEnhance('body')} disabled={isAiProcessing} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
            <Sparkles size={14} className={isAiProcessing ? "animate-spin" : ""} /> AI Enhance Body
          </button>
        </div>
        <textarea
          ref={textareaRef}
          style={{ fontFamily: font, fontWeight: bold ? 'bold' : 'normal' }}
          className="flex-1 p-8 bg-transparent outline-none resize-none font-medium text-slate-700 leading-relaxed text-sm"
          placeholder="Compose message..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        {attachments.length > 0 && (
          <div className="p-4 bg-white/50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
            {attachments.map((f, i) => (
              <div key={i} className="relative shrink-0">
                <AttachmentThumbnail attachment={f} onClick={() => { }} />
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-all">Discard</button>
        <button onClick={() => onSend({ receiver: to, subject, content, attachments, font, bold })} disabled={!content.trim() || (type !== 'reply' && !subject.trim())} className="flex items-center gap-4 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30">
          <Send size={18} /> {type === 'reply' ? 'Send Reply' : type === 'forward' ? 'Forward Email' : 'Send Email'}
        </button>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFile} />
    </div>
  );
};

export const AdminComplaints: React.FC<Props> = ({ complaints, onUpdate, drivers, adminUser }) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedEmail, setSelectedEmail] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred' | 'trash' | 'ai'>('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<Complaint | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [driverLocations, setDriverLocations] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const users = await databaseService.getAllUsers();
        const locMap: Record<string, string> = {};
        users.forEach((u: any) => {
          if (u.role === 'driver') {
            const id = u.employeeId || u.driverId;
            if (id) locMap[id.toLowerCase()] = u.location || '';
          }
        });
        setDriverLocations(locMap);
      } catch (err) {
        console.error("Failed to fetch locations for filtering:", err);
      }
    };
    fetchLocations();
  }, []);

  const filteredMails = useMemo(() => {
    return (complaints || []).filter(c => {
      const searchTxt = (searchTerm || '').toLowerCase();
      const matchesSearch = (c.subject || '').toLowerCase().includes(searchTxt) ||
        (c.messages || []).some(m => (m.senderName || '').toLowerCase().includes(searchTxt));
      if (!matchesSearch) return false;
      if (activeTab === 'trash') return c.isDeletedByAdmin;
      if (c.isDeletedByAdmin) return false;
      if (activeTab === 'starred') return c.isStarredByAdmin;
      if (activeTab === 'ai') return c.isAiRepliedByAdmin;
      if (activeTab === 'sent') {
        return c.messages && c.messages.length > 0 && (c.messages[0].senderEmail || '').toLowerCase() === 'admin@ujjwalhub.ac.in';
      }
      if (activeTab === 'inbox') {
        return c.messages && c.messages.some(m => (m.senderEmail || '').toLowerCase() !== 'admin@ujjwalhub.ac.in');
      }
      return true;
    });
  }, [complaints, activeTab, searchTerm]);

  const handleOpenMail = (mail: Complaint) => {
    setSelectedEmail(mail);
    setView('detail');
    setIsReplyOpen(false);
    setIsForwardOpen(false);
    if (mail.status === 'Unread') {
      onUpdate(complaints.map(c => c.id === mail.id ? { ...c, status: 'Seen' as const } : c));
    }
  };

  const onSendDispatch = (data: { receiver: string, subject: string, content: string, attachments: Attachment[], font: string, bold: boolean }) => {
    const timestamp = new Date().toLocaleString();
    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderName: adminUser.username || 'UjjwalHub Admin',
      senderEmail: 'admin@ujjwalhub.ac.in',
      receiverEmail: data.receiver,
      content: data.content,
      timestamp,
      attachments: data.attachments,
      fontFamily: data.font,
      isBold: data.bold
    };

    if ((isReplyOpen || isForwardOpen) && selectedEmail) {
      // Update existing complaint
      const updatedMessages = [...(selectedEmail.messages || []), newMsg];
      const updates = {
        messages: updatedMessages,
        lastUpdated: timestamp,
        status: 'Replied' as const
      };

      const updatedComplaints = complaints.map(c => c.id === selectedEmail.id ? { ...c, ...updates } : c);
      onUpdate(updatedComplaints);
      setSelectedEmail({ ...selectedEmail, ...updates });

      databaseService.updateComplaint(selectedEmail.id, updates);
    } else {
      const isGeneral = data.receiver === 'all-drivers@ujjwalhub.ac.in';
      const newComplaint: Complaint = {
        id: `CMP-${Date.now()}`,
        threadId: `T-${Date.now()}`,
        subject: data.subject,
        messages: [newMsg],
        targetArea: isGeneral ? adminUser.location : undefined, // ADDED: Set target area for broadcasting
        isStarredByAdmin: false,
        isStarredByDriver: false,
        isDeletedByAdmin: false,
        isDeletedByDriver: false,
        isAiRepliedByAdmin: false,
        lastUpdated: timestamp,
        status: 'Unread'
      };

      onUpdate([newComplaint, ...complaints]);
      databaseService.createComplaint(newComplaint);
    }
    setIsComposeOpen(false);
    setIsReplyOpen(false);
    setIsForwardOpen(false);
  };

  const handleAiAutoReply = (e: React.MouseEvent, mail: Complaint) => {
    e.stopPropagation();
    if (!mail.messages || mail.messages.length === 0) return;
    const lastMsg = mail.messages[mail.messages.length - 1];
    const timestamp = new Date().toLocaleString();
    const aiMsg: Message = {
      id: `AI-${Date.now()}`,
      senderName: 'UjjwalHub Admin AI',
      senderEmail: 'admin@ujjwalhub.ac.in',
      receiverEmail: lastMsg.senderEmail || '',
      content: AI_REPLY_CONTENT(lastMsg.senderName || 'Personnel', adminUser.username || 'Admin'),
      timestamp,
      attachments: []
    };

    const updates = {
      isAiRepliedByAdmin: true,
      status: 'Replied' as const,
      lastUpdated: timestamp,
      messages: [...mail.messages, aiMsg]
    };

    onUpdate(complaints.map(c => c.id === mail.id ? { ...c, ...updates } : c));
    databaseService.updateComplaint(mail.id, updates);
  };

  const handleUndoDelete = () => {
    if (lastDeleted) {
      const updates = { isDeletedByAdmin: false };
      onUpdate(complaints.map(c => c.id === lastDeleted.id ? { ...c, ...updates } : c));
      databaseService.updateComplaint(lastDeleted.id, updates);
      setLastDeleted(null);
    }
  };

  const generateForwardContent = (complaint: Complaint) => {
    if (!complaint.messages || complaint.messages.length === 0) return '';
    const lastMsg = complaint.messages[complaint.messages.length - 1];
    return `\n\n---------- Forwarded message ----------\nFrom: ${lastMsg.senderName || 'Unknown'} <${lastMsg.senderEmail || ''}>\nDate: ${lastMsg.timestamp || ''}\nSubject: ${complaint.subject || ''}\nTo: admin@ujjwalhub.ac.in\n\n${lastMsg.content || ''}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] flex flex-col bg-white md:rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden relative">
      {lastDeleted && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1500] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-slate-800">
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-400" />
              <p className="text-xs font-bold">Thread archived in trash</p>
            </div>
            <button onClick={handleUndoDelete} className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-300">
              <Undo2 size={16} /> Undo
            </button>
          </div>
        </div>
      )}

      {/* HEADER TABS */}
      <div className="px-4 md:px-10 py-4 border-b border-gray-100 flex items-center justify-start md:justify-center gap-4 md:gap-10 z-20 bg-white overflow-x-auto no-scrollbar">
        {[
          { id: 'inbox', icon: Inbox, label: 'Inbox' },
          { id: 'sent', icon: Send, label: 'Sent' },
          { id: 'starred', icon: Star, label: 'Starred' },
          { id: 'ai', icon: Cpu, label: 'AI Text' },
          { id: 'trash', icon: Trash2, label: 'Trash' }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setView('list'); }}
            className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SEARCH AND NEW EMAIL BAR */}
      <div className="px-4 md:px-10 py-6 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between bg-slate-50/20 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {view === 'detail' && (
            <button onClick={() => setView('list')} className="p-3 bg-white border border-slate-100 text-slate-500 rounded-xl shadow-sm hover:text-indigo-600 transition-all active:scale-90"><ChevronLeft size={20} /></button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Search mail logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-inner focus:ring-4 focus:ring-indigo-100 transition-all" />
          </div>
        </div>
        {view === 'list' && (
          <button onClick={() => setIsComposeOpen(true)}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
            <Mail size={18} /> New Email
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/10">
        {view === 'list' ? (
          <div className="divide-y divide-slate-100">
            {filteredMails.length > 0 ? filteredMails.map((mail) => (
              <div key={mail.id} onClick={() => handleOpenMail(mail)}
                className={`flex flex-col md:flex-row items-center gap-4 md:gap-10 px-4 md:px-10 py-6 md:py-8 hover:bg-slate-50/50 cursor-pointer transition-all border-l-8 group ${mail.status === 'Unread' ? 'border-red-500 bg-white' : 'border-transparent opacity-80'}`}>
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <Star size={20} onClick={(e) => { e.stopPropagation(); const updates = { isStarredByAdmin: !mail.isStarredByAdmin }; onUpdate(complaints.map(c => c.id === mail.id ? { ...c, ...updates } : c)); databaseService.updateComplaint(mail.id, updates); }} className={`shrink-0 transition-all hover:scale-125 ${mail.isStarredByAdmin ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-base font-black text-slate-900 truncate uppercase tracking-tight">
                        {mail.messages && mail.messages.length > 0 ? mail.messages[mail.messages.length - 1].senderName : 'Unknown'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${mail.status === 'Unread' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{mail.status}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 truncate">{mail.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{mail.lastUpdated}</p>
                  <div className="flex gap-2">
                    {activeTab === 'inbox' && (
                      <button onClick={(e) => handleAiAutoReply(e, mail)} title="AI Auto-Reply"
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md"><Cpu size={16} /></button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setLastDeleted(mail); onUpdate(complaints.map(c => c.id === mail.id ? { ...c, isDeletedByAdmin: true } : c)); if (selectedEmail?.id === mail.id) setView('list'); }} title="Delete"
                      className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-40 text-center flex flex-col items-center justify-center opacity-20">
                <Inbox size={80} className="mb-6" />
                <p className="text-lg font-black uppercase tracking-[0.4em]">Empty Registry</p>
              </div>
            )}
          </div>
        ) : (
          selectedEmail && (
            <div className="p-4 md:p-12 space-y-12 bg-white min-h-full">
              {/* Detail Header */}
              <div className="flex items-start justify-between border-b border-slate-50 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-black text-[10px] uppercase tracking-widest transition-all"><ArrowLeft size={14} /> Back</button>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">#{selectedEmail.id}</span>
                  </div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{selectedEmail.subject}</h1>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Registry Ref: {selectedEmail.threadId}</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">{(selectedEmail.messages?.length || 0)} Messages Synced</p>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="space-y-10">
                {selectedEmail.messages?.map((msg, i) => (
                  <div key={i} className={`bg-white p-6 md:p-10 rounded-[3rem] border shadow-sm relative transition-all group hover:shadow-xl ${msg.senderEmail === 'admin@ujjwalhub.ac.in' ? 'border-indigo-100 ring-4 ring-indigo-50/30' : 'border-slate-50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${msg.senderEmail === 'admin@ujjwalhub.ac.in' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {(msg.senderName || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{msg.senderName || 'Personnel'}</p>
                          <p className="text-[10px] font-bold text-slate-300 italic">{msg.senderEmail || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-200 tracking-widest uppercase">{msg.timestamp || ''}</span>
                      </div>
                    </div>
                    <AIMessageContent content={msg.content || ''} fontFamily={msg.fontFamily} isBold={msg.isBold} />
                    {(msg.attachments?.length || 0) > 0 && (
                      <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paperclip size={12} /> Digital Attachments ({(msg.attachments?.length || 0)})</p>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                          {msg.attachments?.map((file, idx) => (
                            <AttachmentThumbnail key={idx} attachment={file} onClick={() => setPreviewAttachment(file)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons Section */}
              <div className="flex items-center justify-center gap-12 pt-8 border-t border-slate-50">
                <button
                  onClick={() => { setIsReplyOpen(true); setIsForwardOpen(false); }}
                  className={`flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all group ${isReplyOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Reply size={22} className={`transition-transform ${isReplyOpen ? 'scale-110' : 'group-hover:-translate-x-1'}`} />
                  Reply
                </button>
                <button
                  onClick={() => { setIsForwardOpen(true); setIsReplyOpen(false); }}
                  className={`flex items-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all group ${isForwardOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Forward size={22} className={`transition-transform ${isForwardOpen ? 'scale-110' : 'group-hover:translate-x-1'}`} />
                  Forward
                </button>
              </div>

              {/* Inline Composer (Reply / Forward) */}
              {(isReplyOpen || isForwardOpen) && (
                <div className="animate-in slide-in-from-top-4 duration-500 p-8 md:p-12 bg-white border-2 border-indigo-50 rounded-[3.5rem] shadow-2xl relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isReplyOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isReplyOpen ? <Reply size={24} /> : <Forward size={24} />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{isReplyOpen ? 'Drafting Official Reply' : 'Forwarding Thread Metadata'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Relay Node Active</p>
                      </div>
                    </div>
                    <button onClick={() => { setIsReplyOpen(false); setIsForwardOpen(false); }} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X size={28} /></button>
                  </div>
                  <ComposerComponent
                    type={isReplyOpen ? 'reply' : 'forward'}
                    drivers={drivers}
                    onCancel={() => { setIsReplyOpen(false); setIsForwardOpen(false); }}
                    onSend={onSendDispatch}
                    initialTo={isReplyOpen && selectedEmail.messages && selectedEmail.messages.length > 0
                      ? (selectedEmail.messages[selectedEmail.messages.length - 1].senderEmail || '')
                      : ''}
                    initialSubject={isReplyOpen ? `Re: ${selectedEmail.subject || ''}` : `Fwd: ${selectedEmail.subject || ''}`}
                    initialContent={isForwardOpen ? generateForwardContent(selectedEmail) : ''}
                    adminUser={adminUser}
                    driverLocations={driverLocations}
                  />
                </div>
              )}
              <div className="h-20"></div>
            </div>
          )
        )}
      </div>

      {/* NEW DISPATCH MODAL (Full Overlay) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl border border-white overflow-hidden animate-in slide-in-from-bottom-24 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 px-8 py-8 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Send size={24} /></div>
                <div>
                  <h3 className="font-black text-sm md:text-base uppercase tracking-[0.2em]">New Digital Thread</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Authorized Administrative Service</p>
                </div>
              </div>
              <button onClick={() => setIsComposeOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90"><X size={24} /></button>
            </div>
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <ComposerComponent type="new" drivers={drivers} onCancel={() => setIsComposeOpen(false)} onSend={onSendDispatch} adminUser={adminUser} driverLocations={driverLocations} />
            </div>
          </div>
        </div>
      )}

      {/* ATTACHMENT PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-20 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <button onClick={() => setPreviewAttachment(null)} className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all active:scale-90"><X size={32} /></button>
          <div className="w-full h-full flex flex-col items-center justify-center gap-8">
            {previewAttachment.type.startsWith('image/') ? (
              <img src={previewAttachment.data} alt={previewAttachment.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-3xl" />
            ) : (
              <div className="bg-white p-12 md:p-20 rounded-[4rem] text-center shadow-2xl max-w-lg w-full">
                <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <FileText size={64} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{previewAttachment.name}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-12">Registry Asset Vault • {previewAttachment.type.split('/').pop()?.toUpperCase()}</p>
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewAttachment.data;
                  link.download = previewAttachment.name;
                  link.click();
                }} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Download Dispatch Asset</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
