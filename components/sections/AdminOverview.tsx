
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, DriverProfile, Bin, LeaveRequest } from '../../types';
import {
  User, ClipboardCheck, Calendar, AlertCircle, Banknote, Briefcase, Hash,
  CalendarCheck, Mail, Phone, Clock, ShieldCheck, Download, Printer,
  TrendingUp, History, Shield, Info, ArrowRight, ChevronRight, Activity,
  X, FileText, Landmark, Bell, Scale, CheckCircle2, IndianRupee,
  Building2, Compass, Radio, ScrollText, Megaphone, Zap,
  MapPin
} from 'lucide-react';
import { DynamicLogo } from '../DynamicLogo';
import { databaseService } from '../../services/database.service';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { KANDIGAI_BINS } from '../../constants/kandigaiData';
import { calculateDriverMetrics } from '../../utils/metrics';

interface Props {
  state: AppState;
}

/**
 * Official UjjwalHUB Institutional Stamp
 * Strictly visual seal without signature, for payroll certification.
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

      {/* Outer Security Rings */}
      <circle cx="120" cy="120" r="115" fill="none" stroke="#4f46e5" strokeWidth="4" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4 2" />

      {/* Main Authority Text */}
      <text fill="#4f46e5" className="text-[14px] font-black tracking-[0.2em] uppercase" filter="url(#inkSlight)">
        <textPath xlinkHref="#stampOuterPath" startOffset="0%">
          UJJWAL HUB • URBAN INFRASTRUCTURE & SANITATION • GOVERNMENT OF TAMIL NADU •
        </textPath>
      </text>

      {/* Inner Authority Circle */}
      <circle cx="120" cy="120" r="78" fill="none" stroke="#4f46e5" strokeWidth="2" />
      <text fill="#4f46e5" className="text-[10px] font-bold tracking-widest uppercase">
        <textPath xlinkHref="#stampInnerPath" startOffset="50%" textAnchor="middle">
          MUNICIPAL CORPORATION AUTH • ACT 1949
        </textPath>
      </text>

      {/* Center Emblem (Shield + Pillar) */}
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

/**
 * DriverPanCard Component
 * Modern "PAN Card" style driver identification and performance card.
 */
const DriverPanCard: React.FC<{
  driver: DriverProfile,
  bins: Bin[],
  leaves: LeaveRequest[],
  onViewDossier: () => void
}> = ({ driver, bins, leaves, onViewDossier }) => {
  const metrics = calculateDriverMetrics(driver, bins, leaves);

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden hover:shadow-indigo-200/40 transition-all duration-500 group flex flex-col md:flex-row h-auto md:h-[320px] w-full max-w-[900px] relative mx-auto border border-slate-50">
      {/* 1. Left Side: Photo (One Side) */}
      <div className="w-full md:w-[300px] h-[300px] md:h-full relative overflow-hidden bg-slate-100 shrink-0">
        {driver.profilePhoto ? (
          <img src={driver.profilePhoto} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <User size={100} className="text-white" />
          </div>
        )}
        {/* Verified Badge - Bottom Middle of Photo */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center px-4">
          <div className="bg-[#10b981] text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white/20 animate-in zoom-in duration-500 whitespace-nowrap">
            <ShieldCheck size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Right Side: Identification & Stats (Second Side) */}
      <div className="flex-1 p-8 md:p-10 flex flex-col justify-between relative bg-white overflow-hidden">
        {/* Top Header: Name/ID and Salary */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <h4 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">{driver.username}</h4>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
              <Hash size={12} className="text-slate-400" />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{driver.employeeId || driver.driverId}</span>
            </div>
          </div>
          {/* Top Right Corner Salary */}
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Current Salary</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">₹{metrics.netSalary.toLocaleString()}</p>
          </div>
        </div>

        {/* Profile Row: Phone, Email, Employment, HUB (Spacious, Full Visibility) */}
        <div className="flex justify-between items-start py-6 mb-2 border-y border-slate-50">
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Phone</p>
            <p className="text-sm font-bold text-slate-700">{driver.phone || 'N/A'}</p>
          </div>
          <div className="space-y-1.5 pl-6 border-l border-slate-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Email</p>
            <p className="text-sm font-bold text-slate-700">{driver.email || `${driver.username.split(' ')[0].toLowerCase()}@ujjwal.hub`}</p>
          </div>
          <div className="space-y-1.5 pl-6 border-l border-slate-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Employment</p>
            <p className="text-sm font-bold text-slate-700 uppercase">Full-Time</p>
          </div>
          <div className="space-y-1.5 pl-6 border-l border-slate-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">HUB</p>
            <p className="text-sm font-bold text-slate-700 uppercase">{driver.location || 'Kandigai'}</p>
          </div>
        </div>

        {/* Operational Row: Medium and Neat stats, centered */}
        <div className="flex justify-around items-center py-6 relative z-10 w-full">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Hubs</p>
            <p className="text-xl font-black text-slate-700">23</p>
          </div>
          <div className="flex flex-col items-center px-12 border-x border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tasks Done Today</p>
            <p className="text-xl font-black text-indigo-600">{metrics.todayCompleted}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Leaves Approved</p>
            <p className="text-xl font-black text-emerald-600">{metrics.approvedLeaves}</p>
          </div>
        </div>

        {/* Ujjwal Hub Stamp - Right side bottom corner */}
        <div className="absolute bottom-4 right-4 scale-[0.6] origin-bottom-right rotate-[-12deg] opacity-30 group-hover:opacity-60 transition-all duration-1000 pointer-events-none z-0">
          <OfficialInstitutionalStamp />
        </div>
      </div>
    </div>
  );
};

export const AdminOverview: React.FC<Props> = ({ state }) => {
  const [selectedDriverForDossier, setSelectedDriverForDossier] = useState<DriverProfile | null>(null);

  const filteredDrivers = useMemo(() => {
    if (!state.user || state.user.role !== 'admin') return state.drivers;
    const adminLocation = state.user.location;
    if (!adminLocation || adminLocation === 'Chennai' || adminLocation === 'Total') return state.drivers;

    return state.drivers.filter(d => {
      const loc = (d.location || '').toLowerCase();
      const adminLocNormalized = adminLocation.toLowerCase();

      if (adminLocNormalized === 'kandigai') {
        return loc === 'kandigai' || ['melakottaiyur', 'nallambakkam'].includes(loc);
      }
      if (adminLocNormalized === 'adambakkam') return loc === 'adambakkam';
      if (adminLocNormalized === 'west chengalpattu') {
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur', 'west chengalpattu'];
        return WCP_SUB_AREAS.some(sa => loc.includes(sa));
      }

      return loc === adminLocNormalized;
    });
  }, [state.drivers, state.user]);

  const filteredBins = useMemo(() => {
    if (!state.user || state.user.role !== 'admin') return state.bins;
    const adminLocation = state.user.location;
    if (!adminLocation || adminLocation === 'Total' || adminLocation === 'Chennai') return state.bins;

    const adminLocNormalized = adminLocation.toLowerCase();

    return state.bins.filter(b => {
      const bArea = (b.areaName || '').toLowerCase();
      const bLoc = (b.locationName || '').toLowerCase();

      if (adminLocNormalized === 'kandigai') {
        // Special logic for Kandigai to match driver filtering
        return bArea === 'kandigai' || bLoc === 'kandigai' || ['melakottaiyur', 'nallambakkam'].includes(bLoc);
      }

      if (adminLocNormalized === 'west chengalpattu') {
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur', 'west chengalpattu'];
        return WCP_SUB_AREAS.some(sa => bLoc.includes(sa) || bArea.includes(sa));
      }

      return bArea === adminLocNormalized || bLoc === adminLocNormalized;
    });
  }, [state.bins, state.user]);

  const stats = useMemo(() => ({
    totalDrivers: filteredDrivers.length,
    activeNow: filteredDrivers.filter(d => d.status === 'online').length,
    totalNodes: filteredBins.filter(b => b.status === 'Full' || b.status === 'Half-Full' || b.status === 'Half Full').length,
    completedToday: filteredBins.filter(b => b.status === 'Completed').length,
  }), [filteredDrivers, filteredBins]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 px-4 overflow-hidden">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Personnel', value: stats.totalDrivers, icon: User, color: 'indigo' },
          { label: 'Field Response', value: stats.activeNow, icon: Radio, color: 'emerald' },
          { label: 'Total Tasks', value: stats.totalNodes, icon: ClipboardCheck, color: 'amber' },
          { label: 'Tasks Resolved', value: stats.completedToday, icon: CheckCircle2, color: 'indigo' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 text-${s.color}-600 group-hover:scale-110 transition-transform`}>
              <s.icon size={80} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{s.label}</p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Operation</h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1">Real-time Deployment Log</p>
        </div>
        <div className="flex gap-2">
          <div className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
            <MapPin size={12} /> {state.user?.location || 'Operational'}
          </div>
        </div>
      </div>

      {/* 2. Driver Deployment Grid - Structured one below one (Vertical Stack) */}
      <div className="flex flex-col gap-10">
        {filteredDrivers.map(driver => (
          <DriverPanCard
            key={driver.driverId}
            driver={driver}
            bins={state.bins}
            leaves={state.leaves}
            onViewDossier={() => setSelectedDriverForDossier(driver)}
          />
        ))}
      </div>

      {/* FULL-SCREEN PERFORMANCE DOSSIER MODAL */}
      {selectedDriverForDossier && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-2xl overflow-y-auto custom-scrollbar flex items-start justify-center p-0 md:p-12 print:p-0 print:bg-white print:relative print:block">
          <div className="bg-white w-full max-w-[210mm] min-h-screen shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-12 duration-700 print:shadow-none print:w-full">

            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-8 py-6 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText size={24} /></div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Dossier Viewer</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Subject: {selectedDriverForDossier.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900 transition-all"><Printer size={22} /></button>
                <button onClick={() => setSelectedDriverForDossier(null)} className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900 transition-all"><X size={22} /></button>
              </div>
            </div>

            {/* DOSSIER PAGE 1: PERFORMANCE TRACKER */}
            <div className="p-10 md:p-20 space-y-16 print:p-12">
              <div className="flex flex-col items-center text-center space-y-6 border-b-4 border-slate-900 pb-12">
                <div className="scale-75"><DynamicLogo size={120} animated={false} /></div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.5em]">Performance Tracker</h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.6em]">Government of Tamil Nadu (Act 1949)</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-stretch">
                <div className="w-full md:w-56 flex flex-col items-center gap-6">
                  <div className="w-48 h-48 bg-slate-50 border-4 border-slate-900 shrink-0 flex items-center justify-center overflow-hidden grayscale shadow-2xl">
                    {selectedDriverForDossier.profilePhoto ? <img src={selectedDriverForDossier.profilePhoto} className="w-full h-full object-cover" /> : <User size={80} className="text-slate-200" />}
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedDriverForDossier.username}</h2>
                    <p className="text-xs font-mono font-black text-indigo-600 mt-2 uppercase tracking-widest">ID: {selectedDriverForDossier.employeeId}</p>
                  </div>
                </div>

                <div className="flex-1 bg-white border-2 border-slate-900 p-8 rounded-[3rem] flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Employment Type</p><p className="text-xs font-black text-slate-800 uppercase">Full Time (HQ)</p></div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Joined Date</p><p className="text-xs font-black text-slate-800 uppercase">01 DEC 2025</p></div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Annual CTC</p><p className="text-xs font-black text-slate-800 uppercase">4.08 LPA</p></div>
                    <div><p className="text-[8px] font-black text-indigo-600 uppercase mb-1">PF Contribution</p><p className="text-xs font-black text-indigo-600 uppercase">₹2,000.00 Verified</p></div>
                  </div>
                  <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-1 block">Expected Salary (Month)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-400">₹</span>
                        <span className="text-5xl font-black text-slate-900">{calculateDriverMetrics(selectedDriverForDossier, state.bins, state.leaves).netSalary.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0"><OfficialInstitutionalStamp /></div>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"><Activity size={14} /> Current Operational Progress</h4>
                  <div className="border-2 border-slate-900 overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                          <th className="p-4 border-r border-slate-700">Metric Description</th>
                          <th className="p-4 text-center border-r border-slate-700">Live Sync</th>
                          <th className="p-4 text-right">Synchronization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                        <tr>
                          <td className="p-4 border-r border-slate-200 uppercase">Successfully Collected Hubs</td>
                          <td className="p-4 text-center border-r border-slate-200 text-emerald-600">{calculateDriverMetrics(selectedDriverForDossier, state.bins, state.leaves).todayCompleted} Nodes</td>
                          <td className="p-4 text-right text-emerald-500 uppercase italic">Verified</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"><History size={14} /> Archived Performance (DEC 2025)</h4>
                  <div className="border-2 border-slate-300 rounded-[2rem] overflow-hidden bg-slate-50/50">
                    <div className="grid grid-cols-4 divide-x-2 divide-slate-200">
                      <div className="p-6 text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Tasks Done</p><p className="text-xl font-black text-slate-800">303 Hubs</p></div>
                      <div className="p-6 text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Incomplete</p><p className="text-xl font-black text-red-600">9 Units</p></div>
                      <div className="p-6 text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Leaves</p><p className="text-xl font-black text-slate-800">3 Normal</p></div>
                      <div className="p-6 text-center bg-white"><p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Net Credited</p><p className="text-xl font-black text-indigo-600">₹29,600</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-20 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
                <div className="text-left">
                  <div className="h-24 w-64 border-b-4 border-slate-900 mb-2 relative flex items-center justify-center">
                    <p className="absolute bottom-2 right-0 text-4xl font-bold text-slate-900" style={{ fontFamily: "'Dancing Script', cursive" }}>Sachin Jhawar</p>
                  </div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Authorized Director</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ujjwal Hub Directorate</p>
                </div>
              </div>
            </div>

            {/* DOSSIER PAGE 2: MUNICIPAL COMMAND CENTER */}
            <div className="p-10 md:p-20 space-y-16 break-before-page print:p-12">
              <div className="flex items-center justify-between border-b-4 border-slate-900 pb-10 mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Building2 size={32} /></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Command Center</h2>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1">Live Municipal Operations Hub</p>
                  </div>
                </div>
              </div>

              <div className="mb-12"><h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><Radio size={20} className="text-red-600 animate-pulse" /> Municipal Government Live Events & Notices</h3></div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 flex-1 auto-rows-fr">
                <BulletinCard title="Chennai Municipal Live Operations" badge="LIVE" icon={Activity} content={["Real-time city sanitation drive updates", "Ward-wise night cleaning schedules", "Emergency waste clearance alerts", "Storm & flood readiness operations"]} />
                <BulletinCard title="Zonal Officer – Ashwak Pratap" icon={ShieldCheck} footer="Issued by Zonal Office" content={["Zone-wise bin inspection updates", "Driver route compliance monitoring", "High-priority zones for today", "Mandatory morning check-in rule"]} />
                <BulletinCard title="Operations Manager – Rishabh Gujar" icon={Compass} footer="UjjwalHUB Operations Wing" content={["Daily route optimization guidelines", "Vehicle health & fuel audit reminders", "Performance-based task allocation", "Safety compliance instructions"]} />
                <BulletinCard title="UjjwalHUB Notice Board" icon={Megaphone} content={["New attendance tracking policy", "Revised task escalation protocol", "Uniform & ID compliance rule", "Driver grievance resolution flow"]} />
                <BulletinCard title="Government Sanitation Policies" icon={ScrollText} content={["Solid Waste Management Rules", "Door-to-door collection mandate", "No-dumping zone enforcement", "Penalty & reward framework"]} />
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center text-white relative overflow-hidden shadow-xl"><div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150"><Landmark size={80} /></div><h4 className="text-lg font-black uppercase mb-6">Need Assistance?</h4><button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Contact Dispatch</button></div>
              </div>
            </div>

            <div className="p-12 border-t border-slate-50 bg-slate-50 text-center print:hidden">
              <button onClick={() => setSelectedDriverForDossier(null)} className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Close Dossier Viewer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
