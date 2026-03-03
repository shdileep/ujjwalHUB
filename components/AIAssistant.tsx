
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, Sparkles, Loader2, Zap, Compass, Volume2, ShieldCheck, Cpu, User } from 'lucide-react';
import { AppState, Bin } from '../types';

interface Props {
  state: AppState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateState: (updates: Partial<AppState>) => void;
}

type Language = 'English' | 'Hindi' | 'Tamil' | 'Telugu';

const LANG_MAP: Record<Language, string> = {
  'English': 'en-IN',
  'Hindi': 'hi-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN'
};

/**
 * --- UJJWAL AI NEURAL TRAINING DICTIONARY ---
 */
const TRAINED_INTENTS = {
  WAKE_WORD: ["ujjwal", "ujjaval", "ujwal", "ujval", "உஜ்வல்", "ఉజ్వల్", "ఉజ్జ్వల్", "उज्जवल"],
  
  SALUTATIONS: ["hello", "hi", "hey", "namaste", "vanakkam", "namaskaram", "namskar", "வணக்கம்", "నమస్తే", "नमस्ते"],

  MAPS: {
    OPEN_HOME: {
      en: ["home", "dashboard", "main page"],
      hi: ["होम", "घर", "डैशबोर्ड", "मुख्य"],
      ta: ["முகப்பு", "டேஷ்போர்டு", "வீடு"],
      te: ["హోమ్", "డాష్బోర్డ్", "మెయిన్"]
    },
    OPEN_TASKS: {
      en: ["open tasks", "go to tasks", "show work"],
      hi: ["टास्क खोलो", "काम दिखाओ"],
      ta: ["வேலை பக்கம்", "பணிகள் காட்டு"],
      te: ["పనులు తెరువు", "టాస్క్లు చూపించు"]
    },
    TASK_TODAY_QUERY: {
      en: ["tasks today", "task today", "current tasks", "current task", "what is the task today", "what are the tasks today"],
      hi: ["आज के काम", "आज का टास्क", "आज क्या करना है", "वर्तमान कार्य"],
      ta: ["இன்றைய வேலைகள்", "இன்று என்ன பணிகள்", "தற்போதைய வேலை"],
      te: ["ఈ రోజు పనులు", "ఈరోజు పని ఏంటి", "ప్రస్తుత పని"]
    },
    TOTAL_TASK_QUERY: {
      en: ["total tasks", "how many tasks", "task summary", "total work"],
      hi: ["कुल कितने काम हैं", "टोटल टास्क", "कितने बिन हैं"],
      ta: ["மொத்த வேலைகள்", "எத்தனை குப்பை தொட்டிகள்"],
      te: ["మొత్తం పనులు ఎన్ని", "టాస్క్ల సారాంశం"]
    },
    MY_DETAILS_QUERY: {
      en: ["my details", "who am i", "my info", "profile details", "tell me about me"],
      hi: ["मेरी जानकारी", "मेरी डिटेल्स", "मैं कौन हूँ", "प्रोफाइल बताओ"],
      ta: ["எனது விவரம்", "யார் நான்", "சுயவிவரம்"],
      te: ["నా వివరాలు", "నేను ఎవరు", "ప్రొఫైల్ వివరాలు"]
    },
    SALARY_QUERY: {
      en: ["salary", "what is my salary", "my pay", "money this month", "expected salary", "my salary this month"],
      hi: ["सैलरी कितनी है", "मेरा वेतन", "इस महीने का पैसा", "मेरी सैलरी"],
      ta: ["எனது சம்பளம்", "இந்த மாத சம்பளம்", "பணம் எவ்வளவு"],
      te: ["నా జీతం ఎంత", "ఈ నెల శాలరీ", "డబ్బులు ఎంత వస్తాయి"]
    },
    OPEN_PROFILE: {
      en: ["profile", "me", "identity", "details", "id"],
      hi: ["प्रोफाइल", "पहचान", "आईडी"],
      ta: ["சுயவிவரம்", "அடையாளம்"],
      te: ["ప్రొఫైల్", "ఐడెంటిటీ"]
    },
    ROUTE_ON: {
      en: ["on ujjwal route", "on route", "start route", "enable route", "begin duty", "start duty", "go online", "route on"],
      hi: ["रूट चालू", "ड्यूटी शुरू करो", "रूट ऑन", "ऑन रूट"],
      ta: ["வழியை தொடங்கு", "டியூட்டி தொடங்கு", "ரூட் ஆன்"],
      te: ["రూట్ ఆన్ చేయి", "డ్యూటీ మొదలు పెట్టు", "రూట్ ఆన్"]
    },
    ROUTE_OFF: {
      en: ["off ujjwal route", "off route", "stop route", "disable route", "end duty", "go offline", "route off"],
      hi: ["रूट बंद", "ड्यूटी खत्म करो", "रूट ऑफ", "ऑफ रूट"],
      ta: ["வழியை நிறுத்து", "டியூட்டி முடி", "ரூட் ஆப்"],
      te: ["రూట్ ఆఫ్ చేయి", "డ్యూటీ ఆపు", "రూట్ ఆఫ్"]
    }
  }
};

const UjjwalAIIcon = ({ speaking = false }: { speaking?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    <defs>
      <radialGradient id="neuralOrbGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="70%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#4f46e5" strokeWidth="0.5" strokeDasharray="4 2" className="animate-[spin_20s_linear_infinite]" />
    <circle cx="50" cy="50" r={speaking ? 32 : 26} fill="url(#neuralOrbGrad)" className="transition-all duration-500 ease-out shadow-2xl" />
    {speaking && (
      <>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#4f46e5" strokeWidth="1" className="animate-ping opacity-20" />
        <path d="M35 50 Q50 20 65 50 T95 50" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-pulse opacity-60" />
      </>
    )}
  </svg>
);

export const AIAssistant: React.FC<Props> = ({ state, activeTab, setActiveTab, updateState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('ujjwal_ai_lang') as Language) || 'English');
  const [isListening, setIsListening] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: "Ujjwal Intelligence v3.9.6 Active. Ask 'What are my tasks today?'" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isStartingRecognition = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem('ujjwal_ai_lang', language);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = LANG_MAP[language];
        recognition.onstart = () => { setIsListening(true); isStartingRecognition.current = false; };
        recognition.onresult = (event: any) => {
          if (event?.results?.[0]?.[0]?.transcript) {
            handleLogic(event.results[0][0].transcript);
          }
        };
        recognition.onerror = () => { setIsListening(false); isStartingRecognition.current = false; };
        recognition.onend = () => { setIsListening(false); isStartingRecognition.current = false; };
        recognitionRef.current = recognition;
      }
    } catch (e) { console.error("Recognition Init Error", e); }
  }, [language]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language];
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(LANG_MAP[language]));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
  };

  /**
   * --- THE TRAINED LOGIC ENGINE ---
   */
  const handleLogic = (rawText: string) => {
    if (!rawText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: rawText }]);
    setIsProcessing(true);
    
    setTimeout(() => {
      const intentKey = matchIntent(rawText);
      const { reply, action } = resolveAction(intentKey);
      
      if (action) action();
      
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      speak(reply);
      setIsProcessing(false);
    }, 450);
  };

  const matchIntent = (input: string): string => {
    const text = input.toLowerCase();
    const findMatch = (list: string[]) => list.some(word => text.includes(word.toLowerCase()));

    // Priority 1: Greeting
    const isWake = findMatch(TRAINED_INTENTS.WAKE_WORD);
    const isGreet = findMatch(TRAINED_INTENTS.SALUTATIONS);
    if (isWake && isGreet) return "GREETING_PERSONAL";

    // Priority 2: Standard mappings
    for (const [key, langPool] of Object.entries(TRAINED_INTENTS.MAPS)) {
      const allWords = Object.values(langPool).flat();
      if (findMatch(allWords)) return key;
    }

    return "UNKNOWN";
  };

  const resolveAction = (key: string) => {
    const user = state.user!;
    const userName = user.username || "Driver";
    const driverBins = state.bins.filter(bin => !bin.assignedDriverId || bin.assignedDriverId === user.employeeId);

    switch (key) {
      case "GREETING_PERSONAL":
        return { 
          reply: { 
            English: `Hello ${userName}! Ujjwal AI reporting. Ready for your shift?`, 
            Hindi: `नमस्ते ${userName}! उज्जवल एआई हाजिर है। क्या आप आज काम के लिए तैयार हैं?`, 
            Tamil: `வணக்கம் ${userName}! உஜ்வல் ஏஐ தயாராக உள்ளது.`, 
            Telugu: `నమస్తే ${userName}! ఉజ్వల్ AI సిద్ధంగా ఉంది.` 
          }[language] 
        };

      case "TASK_TODAY_QUERY":
        const pending = driverBins.filter(b => b.status !== 'Completed').length;
        const completed = driverBins.filter(b => b.status === 'Completed').length;
        const msgTask = {
          English: `Redirecting to Tasks page. You have ${pending} pending tasks and ${completed} completed tasks for today.`,
          Hindi: `टास्क पेज पर ले जा रहा हूँ। आज आपके पास ${pending} अधूरे और ${completed} पूरे कार्य हैं।`,
          Tamil: `வேலைகள் பக்கத்திற்கு செல்கிறது. இன்று உங்களுக்கு ${pending} பாக்கி மற்றும் ${completed} முடிந்த வேலைகள் உள்ளன.`,
          Telugu: `పనుల పేజీకి మళ్లించబడుతోంది. మీకు ఈరోజు ${pending} పెండింగ్ మరియు ${completed} పూర్తయిన పనులు ఉన్నాయి.`
        }[language];
        return { reply: msgTask, action: () => setActiveTab('tasks') };

      case "TOTAL_TASK_QUERY":
        const total = driverBins.length;
        const totalCompleted = driverBins.filter(b => b.status === 'Completed').length;
        const totalIncomplete = total - totalCompleted;
        const msgTotal = {
          English: `Total tasks: ${total}. Completed: ${totalCompleted}. Incomplete: ${totalIncomplete}.`,
          Hindi: `कुल काम: ${total}। पूरे हुए: ${totalCompleted}। अधूरे: ${totalIncomplete}।`,
          Tamil: `மொத்த வேலைகள்: ${total}. முடிந்தது: ${totalCompleted}. பாக்கி: ${totalIncomplete}.`,
          Telugu: `మొత్తం పనులు: ${total}. పూర్తయినవి: ${totalCompleted}. ఇంకా చేయాల్సినవి: ${totalIncomplete}.`
        }[language];
        return { reply: msgTotal, action: () => setActiveTab('tasks') };

      case "MY_DETAILS_QUERY":
        const msgDetails = {
          English: `Your name is ${user.username}. Email: ${user.email}. Phone: ${user.phone}. Redirecting to profile.`,
          Hindi: `आपका नाम ${user.username} है। ईमेल ${user.email} और फोन नंबर ${user.phone} है।`,
          Tamil: `உங்கள் பெயர் ${user.username}. மின்னஞ்சல் ${user.email}. போன் ${user.phone}.`,
          Telugu: `మీ పేరు ${user.username}. ఈమెయిల్ ${user.email}. ఫోన్ ${user.phone}.`
        }[language];
        return { reply: msgDetails, action: () => setActiveTab('profile') };

      case "SALARY_QUERY":
        // Centralized Salary Logic (from Overview)
        const BASE_SALARY = 25000;
        const PF = 3000;
        const approvedLeaves = state.leaves.filter(l => l.driverId === user.employeeId && l.status === 'Approved').length;
        const incompleteTasks = state.bins.filter(b => b.assignedDriverId === user.employeeId && b.status !== 'Completed').length;
        const netSalary = Math.max(0, BASE_SALARY - PF - (incompleteTasks * 100) - (approvedLeaves * 200));

        const msgSalary = {
          English: `Dear ${userName}, your current Expected Salary for this Month in Real Time is ₹${netSalary.toLocaleString()}. Redirecting to the Overview page.`,
          Hindi: `प्रिय ${userName}, इस महीने की आपकी रीयल-टाइम अपेक्षित सैलरी ₹${netSalary.toLocaleString()} है। ओवरव्यू पेज पर जा रहे हैं।`,
          Tamil: `அன்புள்ள ${userName}, இந்த மாதத்திற்கான உங்கள் தற்போதைய சம்பளம் ₹${netSalary.toLocaleString()} ஆகும். மேலோட்டப் பக்கத்திற்குச் செல்கிறது.`,
          Telugu: `డియర్ ${userName}, ఈ నెలకు మీ ప్రస్తుత శాలరీ ₹${netSalary.toLocaleString()} గా ఉంది. ఓవర్వ్యూ పేజీకి మళ్లించబడుతోంది.`
        }[language];
        return { reply: msgSalary, action: () => setActiveTab('overview') };

      case "OPEN_HOME": 
        return { reply: { English: "Opening Dashboard.", Hindi: "डैशबोर्ड खोल रहा हूँ।", Tamil: "முகப்பு பக்கம்.", Telugu: "డాష్బోర్డ్." }[language], action: () => setActiveTab('home') };
      
      case "OPEN_TASKS": 
        return { reply: { English: "Opening Tasks.", Hindi: "टास्क पेज।", Tamil: "வேலைகள் பக்கம்.", Telugu: "పనుల పేజీ." }[language], action: () => setActiveTab('tasks') };
      
      case "OPEN_PROFILE": 
        return { reply: { English: "Opening Profile.", Hindi: "प्रोफाइल।", Tamil: "சுயவிவரம்.", Telugu: "ప్రొఫైల్." }[language], action: () => setActiveTab('profile') };

      case "ROUTE_ON":
        return { 
          reply: { English: "Route activated", Hindi: "रूट चालू हो गया", Tamil: "வழியை தொடங்கு", Telugu: "రూట్ ప్రారంభించబడింది" }[language],
          action: () => { setActiveTab('tasks'); updateState({ isUjjwalRouteActive: true, isDriverActive: true }); }
        };

      case "ROUTE_OFF":
        return { 
          reply: { English: "Route stopped", Hindi: "रूट बंद कर दिया गया", Tamil: "வழி நிறுத்தப்பட்டது", Telugu: "రూట్ ఆఫ్ చేయబడింది" }[language],
          action: () => { updateState({ isUjjwalRouteActive: false }); }
        };

      default:
        return { 
          reply: { 
            English: `I'm sorry ${userName}, I didn't recognize that command. Could you please repeat it?`, 
            Hindi: `क्षमा करें ${userName}, मुझे वह समझ नहीं आया। क्या आप दोहरा सकते हैं?`, 
            Tamil: `மன்னிக்கவும் ${userName}, எனக்கு அது புரியவில்லை. மீண்டும் சொல்ல முடியுமா?`, 
            Telugu: `నన్ను క్షమించు ${userName}, నాకు అది అర్థం కాలేదు. మళ్ళీ చెప్పగలరా?` 
          }[language] 
        };
    }
  };

  const startListening = () => {
    if (isListening || isStartingRecognition.current) return;
    try {
      if (recognitionRef.current) {
        isStartingRecognition.current = true;
        recognitionRef.current.start();
      }
    } catch (e) { setIsListening(false); isStartingRecognition.current = false; }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[500]">
        <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-full p-1 border-4 transition-all shadow-2xl active:scale-90 ${isOpen ? 'bg-indigo-600 border-indigo-200 rotate-90' : 'bg-white border-indigo-500/10'}`}>
          <UjjwalAIIcon speaking={isProcessing || isListening || isReading} />
          {isReading && <div className="absolute -top-1 -left-1 bg-indigo-600 text-white p-1 rounded-full animate-bounce"><Volume2 size={12} /></div>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:right-8 sm:bottom-28 sm:w-[420px] z-[490] bg-white sm:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="bg-indigo-900 p-6 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center p-1.5 backdrop-blur-md"><UjjwalAIIcon speaking={isReading || isProcessing} /></div>
              <div>
                <h3 className="font-black text-lg leading-tight tracking-tight">Ujjwal Assistant</h3>
                <div className="flex items-center gap-1.5 opacity-60">
                   <ShieldCheck size={10} className="text-emerald-400" />
                   <span className="text-[8px] font-black uppercase tracking-widest">State-Aware Intelligence v3.9.6</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
          </div>

          <div className="flex gap-2 p-3 bg-slate-50 border-b overflow-x-auto no-scrollbar">
            {(['English', 'Hindi', 'Tamil', 'Telugu'] as Language[]).map(l => (
              <button key={l} onClick={() => setLanguage(l)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${language === l ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>{l}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar min-h-[350px] max-h-[500px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-5 rounded-[1.75rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm w-fit">
                <Cpu size={14} className="text-indigo-600 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Command...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t space-y-4">
            <div className="flex items-center gap-3">
              <button onMouseDown={startListening} onMouseUp={() => recognitionRef.current?.stop()} onTouchStart={startListening} onTouchEnd={() => recognitionRef.current?.stop()} className={`w-16 h-16 rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center ${isListening ? 'bg-red-500 text-white scale-110' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                <Mic size={28} className={isListening ? 'animate-pulse' : ''} />
              </button>
              <div className="relative flex-1">
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && (handleLogic(inputText), setInputText(''))} placeholder={isListening ? "Listening..." : "Ask 'What is my salary?'"} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" />
                <button onClick={() => { handleLogic(inputText); setInputText(''); }} disabled={!inputText.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-30 active:scale-95 transition-all"><Send size={18} /></button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 opacity-20">
               <Zap size={10} className="text-indigo-500" />
               <span className="text-[8px] font-black uppercase tracking-[0.4em]">Real-time State Controller • v3.9.6</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
