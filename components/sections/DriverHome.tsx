
import React, { useState, useEffect, useMemo } from 'react';
import { AppState } from '../../types';
import { MOTIVATIONAL_QUOTES } from '../../constants';
import {
  Clock, CheckCircle2, Power, Timer, Sparkles, Mic,
  ChevronRight, Activity,
  X, Calendar,
  Building2, Megaphone, ShieldCheck
} from 'lucide-react';
import { databaseService } from '../../services/database.service';
import { DynamicLogo } from '../DynamicLogo';
import { calculateDriverMetrics } from '../../utils/metrics';

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

/**
 * Official UjjwalHUB Institutional Stamp
 */
const OfficialInstitutionalStamp = () => (
  <div className="relative w-44 h-44 select-none opacity-80 pointer-events-none" title="Official UjjwalHUB Municipal Seal">
    <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-12 transition-all duration-1000 filter drop-shadow-md">
      <defs>
        <path id="stampOuterPath" d="M 120, 120 m -95, 0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" />
        <path id="stampInnerPath" d="M 120, 120 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
        <filter id="inkSlight">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" />
        </filter>
      </defs>
      <circle cx="120" cy="120" r="115" fill="none" stroke="#4f46e5" strokeWidth="4" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4 2" />
      <text fill="#4f46e5" className="text-[14px] font-black tracking-[0.2em] uppercase" filter="url(#inkSlight)">
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

const BulletinCard: React.FC<{ title: string, content: string[], icon: any, footer?: string, badge?: string }> = ({ title, content, icon: Icon, footer, badge }) => (
  <div className="bg-white border-2 border-slate-900 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:bg-slate-50 transition-all duration-500 h-full">
    {badge && <div className="absolute top-6 right-6 px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">{badge}</div>}
    <div className="space-y-6">
      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{title}</h3>
      <ul className="space-y-3">
        {content.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-600 font-bold leading-relaxed">
            <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full border-2 border-indigo-600 group-hover:bg-indigo-600 transition-all" />
            {item}
          </li>
        ))}
      </ul>
    </div>
    {footer && <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">{footer}</div>}
  </div>
);

export const DriverHome: React.FC<Props> = ({ state, updateState }) => {
  const [clickCount, setClickCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const [showDossier, setShowDossier] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLateTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const lateInfo = useMemo(() => {
    const startLimit = new Date();
    startLimit.setHours(10, 0, 0, 0);

    if (state.isDriverActive && state.activationTime) {
      const activation = new Date(state.activationTime);
      if (activation > startLimit) {
        return { text: `Late by ${formatLateTime(activation.getTime() - startLimit.getTime())}`, isLate: true, fixed: true };
      }
      return { text: "You were on time today!", isLate: false, fixed: true };
    }

    if (!state.isDriverActive && currentTime > startLimit) {
      return { text: `Late by ${formatLateTime(currentTime.getTime() - startLimit.getTime())}`, isLate: true, fixed: false };
    }

    return { text: "Status: Not started", isLate: false, fixed: false };
  }, [state.isDriverActive, state.activationTime, currentTime]);

  const handleToggle = async () => {
    setClickCount(prev => prev + 1);
    setTimeout(() => setClickCount(0), 500);
    if (clickCount === 1) {
      const isActive = !state.isDriverActive;
      updateState({ isDriverActive: isActive, activationTime: isActive ? new Date().toISOString() : null });

      if (isActive && state.user?.employeeId) {
        try {
          await databaseService.recordDutyStart(state.user.employeeId);
        } catch (err) {
          console.error("Failed to record duty start:", err);
        }
      } else if (!isActive && state.user?.employeeId) {
        try {
          await databaseService.recordLogout(state.user.employeeId);
        } catch (err) {
          console.error("Failed to record logout:", err);
        }
      }

      setClickCount(0);
    }
  };

  const metrics = useMemo(() => {
    if (!state.user) return { todayCompleted: 0, todayUncollected: 0, approvedLeaves: 0, netSalary: 0 };
    return calculateDriverMetrics(state.user as any, state.bins, state.leaves);
  }, [state.user, state.bins, state.leaves]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto pb-10 px-4">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />
        <h1 className="text-3xl font-black mb-2">UjjwalHub</h1>
        <p className="text-emerald-100 italic opacity-90 leading-snug">"{quote}"</p>

        <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Work Shift</span>
            <span className="font-bold flex items-center gap-1"><Clock size={14} /> 10:00 AM – 07:00 PM</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">System Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${state.isDriverActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="font-bold uppercase tracking-widest text-xs">{state.isDriverActive ? 'ACTIVE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Gate (Power Button) */}
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Gate</p>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-px w-8 bg-slate-100"></div>
            <p className="text-xs font-bold text-slate-400">Manual or AI Control</p>
            <div className="h-px w-8 bg-slate-100"></div>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border-[10px] active:scale-90 ${state.isDriverActive
            ? 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-emerald-100'
            : 'bg-red-50 text-red-500 border-red-500 shadow-red-100'
            }`}
        >
          <Power size={54} />
        </button>

        <div className="bg-white px-6 py-4 rounded-[2rem] border border-indigo-100 shadow-sm flex items-center gap-4 animate-bounce-slow">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <Mic size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Voice Command Ready</p>
            <p className="text-[11px] font-bold text-slate-500 leading-none mt-1">Say "Start Duty" to AI Assistant</p>
          </div>
          <Sparkles size={16} className="text-indigo-400" />
        </div>
      </div>

      {lateInfo.isLate && (
        <div className={`p-6 rounded-[2rem] border flex items-center gap-4 animate-in slide-in-from-bottom-4 shadow-sm ${lateInfo.isLate ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
          <div className={`p-3 rounded-2xl ${lateInfo.fixed ? 'bg-amber-200' : 'bg-amber-100 animate-pulse'}`}>
            {lateInfo.fixed ? <CheckCircle2 size={24} /> : <Timer size={24} />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">
              {lateInfo.fixed ? 'Finalized Duty Record' : 'Live Delay Counter'}
            </p>
            <p className="font-black text-2xl font-mono">{lateInfo.text}</p>
            {!lateInfo.fixed && <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-widest">Syncing with Municipal Clock...</p>}
          </div>
        </div>
      )}

    </div>
  );
};
