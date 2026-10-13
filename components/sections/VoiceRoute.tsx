
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Navigation,
  CheckCircle2, Zap, Activity, AlertTriangle,
  Radio, Sparkles, ArrowRight, Clock, MapPin,
  Truck
} from 'lucide-react';
import { AppState } from '../../types';
import { syncAll } from '../../services/db.manager';

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  onNavigateToTasks?: () => void;
}

type Lang = 'English' | 'Hindi' | 'Tamil' | 'Telugu';

const LANG_MAP: Record<Lang, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
};

const COMMAND_MAP: { keywords: string[]; intent: string }[] = [
  {
    keywords: ['start route', 'route on', 'start duty', 'begin duty', 'go online', 'enable route', 'activate route',
      'रूट चालू', 'ड्यूटी शुरू', 'வழியை தொடங்கு', 'రూట్ ఆన్'],
    intent: 'ROUTE_ON',
  },
  {
    keywords: ['stop route', 'route off', 'end duty', 'go offline', 'disable route', 'deactivate route',
      'रूट बंद', 'ड्यूटी खत्म', 'வழியை நிறுத்து', 'రూట్ ఆఫ్'],
    intent: 'ROUTE_OFF',
  },
  {
    keywords: ['start duty', 'clock in', 'sign in', 'i am ready', 'duty start',
      'ड्यूटी स्टार्ट', 'वेलई தொடங்கு', 'పని మొదలు'],
    intent: 'START_DUTY',
  },
  {
    keywords: ['stop duty', 'clock out', 'sign out', 'duty end', 'duty over',
      'ड्यूटी बंद', 'வேலை முடிந்தது', 'పని ముగించు'],
    intent: 'STOP_DUTY',
  },
  {
    keywords: ['open tasks', 'show tasks', 'go to tasks', 'my tasks', 'tasks page',
      'टास्क खोलो', 'வேலை பக்கம்', 'పనుల పేజీ'],
    intent: 'NAVIGATE_TASKS',
  },
  {
    keywords: ['next bin', 'next stop', 'next task', 'where next', 'navigate next',
      'अगला बिन', 'அடுத்த குப்பை', 'తదుపరి బిన్'],
    intent: 'NEXT_BIN',
  },
  {
    keywords: ['status', 'what is my status', 'am i online', 'duty status', 'route status',
      'स्टेटस', 'நிலை', 'స్టేటస్'],
    intent: 'STATUS',
  },
  {
    keywords: ['how many tasks', 'task count', 'remaining tasks', 'how many left',
      'कितने काम बचे', 'எத்தனை வேலை', 'ఎన్ని పనులు మిగిలాయి'],
    intent: 'TASK_COUNT',
  },
];

function matchIntent(transcript: string): string {
  const lower = transcript.toLowerCase();
  for (const { keywords, intent } of COMMAND_MAP) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return intent;
  }
  return 'UNKNOWN';
}

// ─── Voice Waveform Animation ───
const VoiceWaveform = ({ active }: { active: boolean }) => {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 9 }, () => 6));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setBars(Array.from({ length: 9 }, () => 6));
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    const animate = () => {
      setBars(Array.from({ length: 9 }, (_, i) =>
        8 + Math.abs(Math.sin(Date.now() / 200 + i * 0.7)) * 24
      ));
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all duration-75"
          style={{
            height: `${h}px`,
            backgroundColor: active ? `hsl(${235 + i * 8}, 80%, 65%)` : '#334155',
          }}
        />
      ))}
    </div>
  );
};

// ─── Pulse Ring ───
const PulseRing = ({ active, color }: { active: boolean; color: string }) => (
  <div className="absolute inset-0 rounded-full pointer-events-none">
    {active && (
      <>
        <div className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ backgroundColor: color }} />
        <div className="absolute inset-[-12px] rounded-full animate-ping opacity-10" style={{ backgroundColor: color, animationDelay: '0.2s' }} />
      </>
    )}
  </div>
);

// ─── Chip ───
const CommandChip = ({ text, emoji }: { text: string; emoji: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/80 rounded-xl">
    <span>{emoji}</span>
    <span className="text-[10px] font-bold text-slate-300">"{text}"</span>
  </div>
);

// ─── VOICE GUIDANCE ENGINE: fires spoken directions when route is active ───
const GUIDANCE_INTERVAL_MS = 60_000; // speak next bin every 60 s when route is ON

export const VoiceRoute: React.FC<Props> = ({ state, updateState, onNavigateToTasks }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('Hold the mic button and speak a command');
  const [feedbackType, setFeedbackType] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [language, setLanguage] = useState<Lang>(
    () => (localStorage.getItem('ujjwal_ai_lang') as Lang) || 'English'
  );

  // Voice guidance is stored in localStorage so the chatbot (AIAssistant)
  // can toggle it independently without touching AppState.
  const [voiceGuidanceOn, setVoiceGuidanceOn] = useState(
    () => localStorage.getItem('ujjwal_voice_guidance') !== 'false'
  );

  const [sessionLog, setSessionLog] = useState<{ time: string; text: string; type: 'cmd' | 'guidance' }[]>([]);

  const recognitionRef = useRef<any>(null);
  const isStarting = useRef(false);
  const guidanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpokenBinRef = useRef<string | null>(null);

  // Sync voiceGuidanceOn to/from localStorage so AIAssistant can toggle it
  useEffect(() => {
    localStorage.setItem('ujjwal_voice_guidance', String(voiceGuidanceOn));
  }, [voiceGuidanceOn]);

  // Poll localStorage for external toggles (from chatbot)
  useEffect(() => {
    const poll = setInterval(() => {
      const stored = localStorage.getItem('ujjwal_voice_guidance');
      const shouldBe = stored !== 'false';
      setVoiceGuidanceOn(prev => (prev !== shouldBe ? shouldBe : prev));
    }, 1500);
    return () => clearInterval(poll);
  }, []);

  // ── Speech synthesis ──
  const speak = useCallback((text: string) => {
    if (!voiceGuidanceOn) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_MAP[language];
    const voices = window.speechSynthesis.getVoices();
    const pref =
      voices.find(v => v.lang.startsWith(LANG_MAP[language])) ||
      voices.find(v => v.lang.includes('en')) ||
      voices[0];
    if (pref) utter.voice = pref;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [language, voiceGuidanceOn]);

  // ── Build speech recognition ──
  useEffect(() => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = LANG_MAP[language];
      rec.onstart = () => { setIsListening(true); isStarting.current = false; };
      rec.onresult = (e: any) => {
        const text = e?.results?.[0]?.[0]?.transcript || '';
        if (text) { setTranscript(text); processCommand(text); }
      };
      rec.onerror = () => { setIsListening(false); isStarting.current = false; };
      rec.onend = () => { setIsListening(false); isStarting.current = false; };
      recognitionRef.current = rec;
    } catch (e) { console.error('SR init', e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ujjwal_ai_lang', language);
  }, [language]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch (_) {}
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      if (guidanceTimerRef.current) clearInterval(guidanceTimerRef.current);
    };
  }, []);

  // ── Get next pending bin for the driver ──
  const getNextBin = useCallback(() => {
    const userLocation = (state.user?.location || '').toLowerCase();
    const userEmployeeId = state.user?.employeeId;
    return state.bins.find(b => {
      const status = (b.status || '').toLowerCase();
      if (status === 'completed' || status === 'empty') return false;
      if (b.assignedDriverId && b.assignedDriverId !== userEmployeeId) return false;
      const binArea = (b.areaName || '').toLowerCase();
      return !userLocation || binArea.includes(userLocation) || userLocation.includes(binArea) || true;
    });
  }, [state.bins, state.user]);

  // ── Route-active voice guidance engine ──
  useEffect(() => {
    if (guidanceTimerRef.current) clearInterval(guidanceTimerRef.current);

    if (!state.isUjjwalRouteActive || !voiceGuidanceOn) return;

    // Speak immediately on route activation
    const nextBin = getNextBin();
    if (nextBin && nextBin.locationName !== lastSpokenBinRef.current) {
      const msg = `Route active. Next stop: ${nextBin.locationName || nextBin.id}. Bin status: ${nextBin.status}.`;
      speak(msg);
      lastSpokenBinRef.current = nextBin.locationName || nextBin.id;
      addToLog(msg, 'guidance');
    }

    // Repeat every 60 seconds while route is active
    guidanceTimerRef.current = setInterval(() => {
      const bin = getNextBin();
      if (!bin) {
        speak('All bins completed. Please proceed to the dump yard.');
        addToLog('All bins completed.', 'guidance');
        return;
      }
      if (bin.locationName !== lastSpokenBinRef.current) {
        const msg = `Next stop: ${bin.locationName || bin.id}. Bin status: ${bin.status}.`;
        speak(msg);
        lastSpokenBinRef.current = bin.locationName || bin.id;
        addToLog(msg, 'guidance');
      }
    }, GUIDANCE_INTERVAL_MS);

    return () => { if (guidanceTimerRef.current) clearInterval(guidanceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isUjjwalRouteActive, voiceGuidanceOn, getNextBin]);

  const addToLog = (text: string, type: 'cmd' | 'guidance') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSessionLog(prev => [{ time: now, text, type }, ...prev].slice(0, 10));
  };

  const setFeedbackState = (msg: string, type: 'idle' | 'success' | 'error' | 'info') => {
    setFeedback(msg);
    setFeedbackType(type);
    speak(msg);
    addToLog(msg, 'cmd');
  };

  // ── Command handler ──
  const processCommand = async (text: string) => {
    const intent = matchIntent(text);
    const userName = state.user?.username || 'Driver';

    switch (intent) {
      case 'ROUTE_ON':
        updateState({ isUjjwalRouteActive: true, isDriverActive: true });
        setFeedbackState(`Route activated, ${userName}. Voice guidance is live.`, 'success');
        break;

      case 'ROUTE_OFF':
        updateState({ isUjjwalRouteActive: false });
        setFeedbackState('Route deactivated.', 'info');
        break;

      case 'START_DUTY':
        if (!state.isDriverActive) {
          updateState({ isDriverActive: true, activationTime: new Date().toISOString() });
          if (state.user?.employeeId) {
            try {
              await syncAll.driverLogin(
                state.user.employeeId,
                state.user.username || 'Driver',
                (state.user as any).location || ''
              );
            } catch (err) { console.error('Duty start log failed:', err); }
          }
          setFeedbackState(`Duty started, ${userName}. System is now active.`, 'success');
        } else {
          setFeedbackState(`${userName}, you are already on duty.`, 'info');
        }
        break;

      case 'STOP_DUTY':
        if (state.isDriverActive) {
          updateState({ isDriverActive: false, isUjjwalRouteActive: false, activationTime: null });
          if (state.user?.employeeId) {
            try {
              await syncAll.driverLogout(
                state.user.employeeId,
                state.user.username || 'Driver',
                (state.user as any).location || ''
              );
            } catch (err) { console.error('Duty stop log failed:', err); }
          }
          setFeedbackState(`Duty ended, ${userName}. Good work today!`, 'info');
        } else {
          setFeedbackState(`${userName}, you are already offline.`, 'info');
        }
        break;

      case 'NAVIGATE_TASKS':
        setFeedbackState('Opening Tasks page.', 'success');
        onNavigateToTasks?.();
        break;

      case 'NEXT_BIN': {
        const bin = getNextBin();
        if (bin) {
          setFeedbackState(`Next stop: ${bin.locationName || bin.id}. Status: ${bin.status}.`, 'info');
        } else {
          setFeedbackState('All your tasks are done! Head to the dump yard.', 'success');
        }
        break;
      }

      case 'STATUS': {
        const s = state.isDriverActive ? 'online and active' : 'offline';
        const r = state.isUjjwalRouteActive ? 'Route is active.' : 'Route is inactive.';
        const v = voiceGuidanceOn ? 'Voice guidance is on.' : 'Voice guidance is off.';
        setFeedbackState(`${userName}, you are ${s}. ${r} ${v}`, 'info');
        break;
      }

      case 'TASK_COUNT': {
        const pending = state.bins.filter(b => {
          const s = (b.status || '').toLowerCase();
          return s !== 'completed' && s !== 'empty' &&
            (!b.assignedDriverId || b.assignedDriverId === state.user?.employeeId);
        }).length;
        const completed = state.bins.filter(b =>
          (b.status || '').toLowerCase() === 'completed' &&
          (!b.assignedDriverId || b.assignedDriverId === state.user?.employeeId)
        ).length;
        setFeedbackState(`${pending} tasks remaining, ${completed} completed.`, 'info');
        break;
      }

      default:
        setFeedbackState(`Sorry ${userName}, I didn't catch that. Try "Next Bin" or "Route On".`, 'error');
        break;
    }
  };

  const startListening = () => {
    if (isListening || isStarting.current) return;
    try {
      isStarting.current = true;
      recognitionRef.current?.start();
    } catch (_) {
      setIsListening(false);
      isStarting.current = false;
    }
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
  };

  const feedbackColors = {
    idle: 'bg-slate-800/50 border-slate-700 text-slate-400',
    success: 'bg-emerald-900/40 border-emerald-700 text-emerald-300',
    error: 'bg-red-900/30 border-red-800 text-red-300',
    info: 'bg-indigo-900/30 border-indigo-700 text-indigo-300',
  };

  const nextBinForDisplay = getNextBin();
  const pendingCount = state.bins.filter(b => {
    const s = (b.status || '').toLowerCase();
    return s !== 'completed' && s !== 'empty' &&
      (!b.assignedDriverId || b.assignedDriverId === state.user?.employeeId);
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col animate-in fade-in duration-500 relative overflow-hidden pb-24">

      {/* Ambient background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-10"
            style={{ left: `${(i * 137.5) % 100}%`, top: `${(i * 97.3) % 100}%` }}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1 flex items-center gap-1">
            <Radio size={8} /> Voice Navigation
          </p>
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight">Voice Route</h1>
          <p className="text-slate-400 text-xs font-bold mt-1">Speak to navigate. Guidance plays automatically.</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Voice guidance toggle */}
          <button
            onClick={() => {
              const next = !voiceGuidanceOn;
              setVoiceGuidanceOn(next);
              localStorage.setItem('ujjwal_voice_guidance', String(next));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${voiceGuidanceOn
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900'
              : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {voiceGuidanceOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
            {voiceGuidanceOn ? 'Guidance On' : 'Guidance Off'}
          </button>
          {/* Duty status */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${state.isDriverActive
            ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800'
            : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${state.isDriverActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {state.isDriverActive ? 'On Duty' : 'Offline'}
          </div>
        </div>
      </div>

      {/* ── Language selector ── */}
      <div className="relative z-10 px-6 pb-5 flex gap-2 overflow-x-auto no-scrollbar">
        {(['English', 'Hindi', 'Tamil', 'Telugu'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all ${language === l
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900'
              : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Route Status Banner ── */}
      <div className="relative z-10 px-6 pb-5">
        <div className={`w-full p-4 rounded-2xl flex items-center gap-4 border transition-all ${state.isUjjwalRouteActive
          ? 'bg-emerald-900/30 border-emerald-700'
          : 'bg-slate-800/40 border-slate-700'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${state.isUjjwalRouteActive ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <Navigation size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-widest ${state.isUjjwalRouteActive ? 'text-emerald-400' : 'text-slate-500'}`}>
              Ujjwal Route
            </p>
            <p className={`text-sm font-bold ${state.isUjjwalRouteActive ? 'text-emerald-200' : 'text-slate-400'}`}>
              {state.isUjjwalRouteActive
                ? `🟢 Active — ${pendingCount} tasks remaining`
                : '⚫ Say "Route On" to start'}
            </p>
          </div>
          {state.isUjjwalRouteActive && voiceGuidanceOn && (
            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-900/50 rounded-lg border border-indigo-700 shrink-0">
              <Volume2 size={10} className="text-indigo-400 animate-pulse" />
              <span className="text-[8px] font-black text-indigo-400 uppercase">Live</span>
            </div>
          )}
          {state.isUjjwalRouteActive && onNavigateToTasks && (
            <button
              onClick={onNavigateToTasks}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-500 transition-all active:scale-95 shrink-0"
            >
              Map <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Next Bin Info (when route active) ── */}
      {state.isUjjwalRouteActive && nextBinForDisplay && (
        <div className="relative z-10 px-6 pb-5 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-indigo-900/30 border border-indigo-700/60 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Next Stop</p>
              <p className="text-sm font-black text-white truncate">{nextBinForDisplay.locationName || nextBinForDisplay.id}</p>
              <p className="text-[10px] font-bold text-slate-400">{nextBinForDisplay.status} • {nextBinForDisplay.areaName}</p>
            </div>
            <button
              onClick={() => {
                const bin = getNextBin();
                if (bin) {
                  const msg = `Next stop: ${bin.locationName || bin.id}. Status: ${bin.status}.`;
                  setFeedback(msg);
                  setFeedbackType('info');
                  speak(msg);
                }
              }}
              className="shrink-0 w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-all active:scale-90"
              title="Repeat next stop"
            >
              <Volume2 size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Centre Mic Orb ── */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-6">
        <div className="relative flex items-center justify-center mb-5">
          <PulseRing active={isListening} color={isListening ? '#ef4444' : '#4f46e5'} />
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={(e) => { e.preventDefault(); startListening(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 select-none
              ${isListening
                ? 'bg-red-600 border-[6px] border-red-400 shadow-red-900'
                : 'bg-gradient-to-br from-indigo-600 to-indigo-800 border-[6px] border-indigo-400/60 shadow-indigo-900'
              }`}
          >
            {isListening ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest mt-1.5">
              {isListening ? 'Release' : 'Hold & Speak'}
            </span>
          </button>
        </div>

        {/* Waveform */}
        <div className="mb-4">
          <VoiceWaveform active={isListening || isSpeaking} />
        </div>

        {/* Last transcript */}
        {transcript && (
          <div className="px-5 py-3 bg-slate-800/60 border border-slate-700 rounded-2xl mb-4 max-w-xs text-center animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
              <Radio size={8} /> Heard
            </p>
            <p className="text-sm font-bold text-white">"{transcript}"</p>
          </div>
        )}

        {/* AI Feedback */}
        <div className={`w-full max-w-sm px-5 py-4 border rounded-2xl transition-all duration-300 ${feedbackColors[feedbackType]}`}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {feedbackType === 'success' && <CheckCircle2 size={16} />}
              {feedbackType === 'error' && <AlertTriangle size={16} />}
              {feedbackType === 'info' && <Sparkles size={16} />}
              {feedbackType === 'idle' && <Mic size={16} />}
            </div>
            <p className="text-sm font-bold leading-relaxed">{feedback}</p>
          </div>
          {isSpeaking && (
            <div className="mt-2 flex items-center gap-1.5 opacity-60">
              <Volume2 size={9} />
              <span className="text-[8px] font-black uppercase tracking-widest">Speaking...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Commands ── */}
      <div className="relative z-10 px-6 pb-5">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Zap size={9} /> Command Reference
        </p>
        <div className="grid grid-cols-2 gap-2">
          <CommandChip text="Route On" emoji="🗺️" />
          <CommandChip text="Route Off" emoji="🛑" />
          <CommandChip text="Start Duty" emoji="⚡" />
          <CommandChip text="End Duty" emoji="🏁" />
          <CommandChip text="Next Bin" emoji="📍" />
          <CommandChip text="My Status" emoji="📡" />
          <CommandChip text="How many tasks" emoji="📋" />
          <CommandChip text="Open Tasks" emoji="🗂️" />
        </div>
        <p className="text-[8px] font-bold text-slate-600 mt-3 text-center">
          You can also toggle voice guidance from the AI chatbot button (bottom right)
        </p>
      </div>

      {/* ── Session Log ── */}
      {sessionLog.length > 0 && (
        <div className="relative z-10 px-6">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Activity size={9} /> Session Log
          </p>
          <div className="space-y-2">
            {sessionLog.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 rounded-2xl border animate-in fade-in ${entry.type === 'guidance'
                  ? 'bg-indigo-900/20 border-indigo-800/50'
                  : 'bg-slate-800/30 border-slate-700/50'}`}
              >
                <div className="shrink-0 flex flex-col items-center gap-1">
                  {entry.type === 'guidance' ? <Navigation size={9} className="text-indigo-400" /> : <Radio size={9} className="text-slate-500" />}
                  <span className="text-[7px] font-bold text-slate-600">{entry.time}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-300 leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
