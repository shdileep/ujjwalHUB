
import React, { useState, useMemo, useEffect } from 'react';
import { Menu, X, LogOut, UserCircle, Bell, RefreshCw, ShieldAlert, PartyPopper, CheckCircle2, Award, User, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { AppState } from '../types';
import { DRIVER_NAV_ITEMS } from '../constants';
import { DriverHome } from './sections/DriverHome';
import { DriverTasks } from './sections/DriverTasks';
import { DriverPayments } from './sections/DriverPayments';
import { DriverLeaves } from './sections/DriverLeaves';
import { Notifications } from './sections/Notifications';
import { DriverComplaints } from './sections/DriverComplaints';
import { Settings } from './sections/Settings';
import { Profile } from './sections/Profile';
import { DynamicLogo } from './DynamicLogo';
import { DriverOverview } from './sections/DriverOverview';
import { AIAssistant } from './AIAssistant';

interface Props {
  state: AppState;
  onLogout: () => void;
  updateState: (updates: Partial<AppState>) => void;
  onSync: () => void;
  binsLoading?: boolean;
  tasksLoading?: boolean;
  driversLoading?: boolean;
}

const OfficialSealedStamp = () => (
  <div className="relative w-44 h-44 select-none opacity-90 pointer-events-none">
    <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-12 filter drop-shadow-md">
      <defs>
        <path id="stampOuterPath" d="M 120, 120 m -95, 0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" />
        <path id="stampInnerPath" d="M 120, 120 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" />
        <filter id="inkSlight">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" />
        </filter>
      </defs>
      <circle cx="120" cy="120" r="115" fill="none" stroke="#059669" strokeWidth="4" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="4 2" />
      <text fill="#059669" className="text-[14px] font-black tracking-[0.2em] uppercase" filter="url(#inkSlight)">
        <textPath xlinkHref="#stampOuterPath" startOffset="0%">
          UJJWAL HUB • URBAN INFRASTRUCTURE & SANITATION • GOVERNMENT OF TAMIL NADU •
        </textPath>
      </text>
      <circle cx="120" cy="120" r="78" fill="none" stroke="#059669" strokeWidth="2" />
      <text fill="#059669" className="text-[10px] font-bold tracking-widest uppercase">
        <textPath xlinkHref="#stampInnerPath" startOffset="50%" textAnchor="middle">
          MUNICIPAL CORPORATION AUTH • ACT 1949
        </textPath>
      </text>
      <g transform="translate(120, 120)">
        {[...Array(12)].map((_, i) => (
          <line key={i} x1="0" y1="-35" x2="0" y2="-45" stroke="#059669" strokeWidth="1.5" transform={`rotate(${i * 30})`} opacity="0.4" />
        ))}
        <path d="M-25,-30 L25,-30 L25,5 C25,20 0,35 0,35 C0,35 -25,20 -25,5 Z" fill="white" stroke="#059669" strokeWidth="2" />
        <path d="M-12,-15 L-12,5 C-12,12 0,18 0,18 C0,18 12,12 12,5 L12,-15" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
        <rect x="-12" y="-18" width="24" height="6" rx="1" fill="#059669" />
        <path d="M-35,10 Q-45,25 -30,40 M35,10 Q45,25 30,40" fill="none" stroke="#059669" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <text y="55" textAnchor="middle" fill="#059669" className="text-[8px] font-black uppercase tracking-[0.3em]">ESTD 2026</text>
      </g>
    </svg>
  </div>
);

export const DriverDashboard: React.FC<Props> = ({ state, onLogout, updateState, onSync, binsLoading, tasksLoading, driversLoading }) => {
  const [forceEnter, setForceEnter] = useState(false);

  // Safety Timeout: Force entry if loading takes > 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceEnter(true);
      console.warn("DriverDashboard: Synchronization timeout. Forcing entry.");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const unreadCount = useMemo(() => state.notifications.filter(n => !n.read).length, [state.notifications]);

  const currentDriver = useMemo(() => {
    return state.drivers.find(d => d.employeeId === state.user?.employeeId);
  }, [state.drivers, state.user]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onSync();
    }, 1500);
  };

  const acknowledgeRecovery = () => {
    if (currentDriver) {
      const updatedDrivers = state.drivers.map(d =>
        d.employeeId === currentDriver.employeeId ? { ...d, needsRecoveryNotice: false } : d
      );
      updateState({ drivers: updatedDrivers });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <DriverHome state={state} updateState={updateState} />;
      case 'overview': return <DriverOverview state={state} />;
      case 'profile': return state.user ? <Profile user={state.user} onUpdate={(u) => updateState({ user: u })} /> : <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;
      case 'tasks': return <DriverTasks state={state} updateState={updateState} />;
      case 'leaves': return <DriverLeaves state={state} updateState={updateState} />;
      case 'complaints': return <DriverComplaints state={state} updateState={updateState} />;
      case 'notifications': return <Notifications notifications={state.notifications} onUpdate={(n) => updateState({ notifications: n })} readonly />;
      case 'payments': return <DriverPayments state={state} />;
      case 'settings': return <Settings role="driver" />;
      default: return <DriverHome state={state} updateState={updateState} />;
    }
  };

  const isRestricted = currentDriver && !currentDriver.isActive;
  const showRecoveryCard = currentDriver && currentDriver.isActive && currentDriver.needsRecoveryNotice;

  const isSyncingData = tasksLoading;


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {!isRestricted && !showRecoveryCard && <AIAssistant state={state} activeTab={activeTab} setActiveTab={setActiveTab} updateState={updateState} />}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-16 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">U</span></div>
            <span className="hidden sm:inline font-black text-gray-800 text-lg">UjjwalHub</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSync} disabled={isSyncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isSyncing ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-500 hover:text-emerald-600'
              }`}>
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} />
            <div className="hidden xs:flex flex-col items-start leading-none">
              <span className="text-[9px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync All'}</span>
              {!isSyncing && <span className="text-[7px] font-bold text-gray-300 mt-0.5">{state.lastSynced}</span>}
            </div>
          </button>

          <button onClick={() => setActiveTab('notifications')} className={`p-2 relative transition-colors ${activeTab === 'notifications' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="p-1 border-2 border-emerald-100 rounded-full">
              <UserCircle size={28} className="text-emerald-600" />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { setActiveTab('profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><UserCircle size={16} /> Profile</button>
                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {isRestricted ? (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
              {/* Main Blocked Card */}
              <div className="bg-white rounded-none border-t-[8px] border-red-600 shadow-2xl overflow-hidden mb-4">
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-none border border-red-100 flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Account Restriction Notice</h3>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">
                    Dear <span className="text-red-600">{state.user?.username}</span>,<br />
                    Your account has been blocked by the <span className="font-black text-slate-800">Ujjwal Hub Authority</span>.<br />
                    Please contact the <span className="text-indigo-600">Chennai Section Officer</span> for further clarification and resolution.
                  </p>
                </div>

                <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Shubham Raj</p>
                      <p className="text-[10px] font-bold text-indigo-500">shubham@ujjwal.ac.in</p>
                    </div>
                  </div>
                  <div className="shrink-0 opacity-40 grayscale"><OfficialSealedStamp /></div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-white flex flex-col items-center">
                  <div className="text-center mb-6">
                    <p className="text-base font-bold text-slate-900 italic leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>Sachin Jhawar</p>
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">Authorized Director (Digital Signature)</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all active:scale-95"
                  >
                    System Logout
                  </button>
                </div>
              </div>

              {/* Footer Bar */}
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white/40">
                <span className="text-[8px] font-black uppercase tracking-widest">ujjwalhub.ac.in</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">© Copyrights 2026</span>
              </div>
            </div>
          </div>
        ) : showRecoveryCard ? (
          <div className="fixed inset-0 z-[100] bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md animate-in slide-in-from-bottom-12 duration-700">
              <div className="bg-white rounded-none border-t-[8px] border-emerald-500 shadow-2xl overflow-hidden mb-4">
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-none border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <PartyPopper size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Access Restoration</h3>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">
                    Dear <span className="text-emerald-600">{state.user?.username}</span>,<br />
                    We appreciate your sincerity and dedication toward <span className="font-black text-slate-800">Ujjwal Hub</span>.<br />
                    <span className="text-indigo-600">Welcome back!</span> Your commitment helps us serve the city better.
                  </p>
                </div>

                <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Shubham Raj</p>
                      <p className="text-[10px] font-bold text-indigo-500">shubham@ujjwal.ac.in</p>
                    </div>
                  </div>
                  <div className="shrink-0 opacity-40 grayscale"><OfficialSealedStamp /></div>
                </div>

                <div className="p-10 border-t border-slate-50 bg-white flex flex-col items-center">
                  <div className="text-center mb-6">
                    <p className="text-base font-bold text-slate-900 italic leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>Sachin Jhawar</p>
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">Authorized Director (Digital Signature)</p>
                  </div>
                  <button
                    onClick={acknowledgeRecovery}
                    className="w-full py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-4 flex justify-between items-center text-white/40">
                <span className="text-[8px] font-black uppercase tracking-widest">ujjwalhub.ac.in</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">© Copyrights 2026</span>
              </div>
            </div>
          </div>
        ) : renderContent()}
      </main>

      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-[60] flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xl">U</span></div>
                <h3 className="font-black text-gray-800">UjjwalHub <span className="text-[8px] block text-emerald-600 uppercase tracking-widest">Field Service</span></h3>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400"><X size={24} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
              {DRIVER_NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  disabled={(!state.isDriverActive && !['home', 'profile', 'notifications', 'settings', 'overview', 'payments'].includes(item.id)) || isRestricted}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all disabled:opacity-30 ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-500 hover:bg-emerald-50'}`}>
                  {item.icon}<span className="font-bold">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* SIDEBAR LOGOUT BUTTON */}
            <div className="p-4 border-t border-gray-50">
              <button
                onClick={() => { onLogout(); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all font-black uppercase text-[10px] tracking-widest active:scale-95"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
