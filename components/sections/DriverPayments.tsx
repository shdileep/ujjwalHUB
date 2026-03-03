
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Attachment } from '../../types';
import {
   Wallet, Landmark, History, FileText, Download,
   Share2, Save, Printer, X, ShieldCheck,
   TrendingUp, CheckCircle2, RefreshCw, AlertCircle,
   IndianRupee, ArrowRight, Banknote, Clock
} from 'lucide-react';

import { KANDIGAI_BINS } from '../../constants/kandigaiData';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { getSpecialAreaBins } from '../../utils/binRandomizer';
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

export const DriverPayments: React.FC<Props> = ({ state }) => {
   const [activePaySlip, setActivePaySlip] = useState<any | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   const [showCreditPopup, setShowCreditPopup] = useState(false);
   const user = state.user!;

   // Financial Constants
   const GROSS_MONTHLY = 34000;
   const PF_MONTHLY = 2000;
   const BASE_NET_F = GROSS_MONTHLY - PF_MONTHLY; // ₹32,000

   // Use shared metrics utility for consistent salary calculation
   const metrics = useMemo(() => calculateDriverMetrics(user as any, state.bins, state.leaves), [user, state.bins, state.leaves]);
   const projectedNetSalary = metrics.netSalary;
   const incompleteTasks = metrics.todayUncollected;
   const approvedLeaves = metrics.approvedLeaves;

   // Time & Ledger Logic
   const [now, setNow] = useState(new Date());

   useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   const ledgerInfo = useMemo(() => {
      const startMonthIndex = 11; // December (0-indexed)
      const startYear = 2025;
      const currentMonthIndex = now.getMonth();
      const currentYear = now.getFullYear();

      let monthsElapsed = 0;
      const ledger = [];
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      let iterMonth = startMonthIndex;
      let iterYear = startYear;

      while (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonthIndex)) {
         const isCurrentMonth = (iterYear === currentYear && iterMonth === currentMonthIndex);
         const nextMonthFirstDay = new Date(iterYear, iterMonth + 1, 1);
         const isEndPassed = now >= nextMonthFirstDay;

         const status = isCurrentMonth ? 'Processing' : 'Credited';
         const refCode = `UHB-${iterYear.toString().slice(-2)}-${(iterMonth + 1).toString().padStart(3, '0')}`;

         const isJan2026 = iterYear === 2026 && iterMonth === 0;
         const historyIncomplete = isJan2026 ? 5 : 0;
         const historyLeaves = isJan2026 ? 3 : 0;
         const historyTaskDeduction = historyIncomplete * 100; // Updated to match utility (100 per uncollected)
         const historyLeavePenaltyCombined = historyLeaves * 500; // Simplified
         const historyNet = BASE_NET_F - historyTaskDeduction - historyLeavePenaltyCombined;

         const entry = {
            month: `${monthNames[iterMonth]} ${iterYear}`,
            gross: GROSS_MONTHLY,
            net: isCurrentMonth ? projectedNetSalary : historyNet,
            pf: PF_MONTHLY,
            status: status,
            incomplete: isCurrentMonth ? incompleteTasks : historyIncomplete,
            leaves: isCurrentMonth ? approvedLeaves : historyLeaves,
            ref: refCode,
            creditDate: isCurrentMonth ? `Awaiting Month-End (${new Date(iterYear, iterMonth + 1, 0).getDate()} ${monthNames[iterMonth].slice(0, 3).toUpperCase()})` : `01 ${monthNames[iterMonth === 11 ? 0 : iterMonth + 1].slice(0, 3).toUpperCase()} ${iterMonth === 11 ? iterYear + 1 : iterYear}, 00:01 AM`
         };

         ledger.unshift(entry);
         monthsElapsed++;

         iterMonth++;
         if (iterMonth > 11) {
            iterMonth = 0;
            iterYear++;
         }
      }

      const currentPfBalance = (monthsElapsed - 1) * PF_MONTHLY;

      return {
         ledger,
         currentPfBalance: currentPfBalance > 0 ? currentPfBalance : PF_MONTHLY,
         monthsElapsed
      };
   }, [now, projectedNetSalary, incompleteTasks, approvedLeaves]);


   useEffect(() => {
      setIsSyncing(true);
      const t = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(t);
   }, [projectedNetSalary]);

   useEffect(() => {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      if (now.getDate() === lastDay.getDate() && now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 0) {
         setShowCreditPopup(true);
         setTimeout(() => setShowCreditPopup(false), 10000);
      }
   }, [now]);

   return (
      <div className="relative min-h-screen bg-slate-50 flex flex-col pb-24">

         {showCreditPopup && (
            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[2000] bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-500 border-4 border-emerald-400">
               <CheckCircle2 size={24} className="animate-bounce" />
               <span className="font-black tracking-widest uppercase text-sm">Salary Auto-Credited Successfully!</span>
            </div>
         )}

         <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-6 shadow-sm">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

               {/* PROJECTED SALARY PANEL */}
               <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <Wallet size={80} />
                  </div>
                  {isSyncing && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}

                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Projected Net Pay (Current Month)</p>
                        <RefreshCw size={10} className={`${isSyncing ? 'animate-spin' : ''} text-white/40`} />
                     </div>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-indigo-300">₹</span>
                        <h2 className="text-4xl font-black tracking-tighter tabular-nums transition-all duration-300">
                           {projectedNetSalary.toLocaleString()}
                        </h2>
                        <span className="text-[10px] font-black text-indigo-300 opacity-60">.00</span>
                     </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 relative z-10">
                     <div className="flex items-center justify-end">
                        <span className="text-[8px] font-mono font-bold text-white/40 tracking-widest uppercase">Bank: **** 1290</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Clock size={12} className="text-amber-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Crediting on Last Day, 11:59 PM</span>
                     </div>
                  </div>
               </div>

               {/* PF ACCOUNT PANEL (CUMULATIVE GROWTH) */}
               <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <Landmark size={80} />
                  </div>

                  <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Cumulative PF Balance</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-indigo-400">₹</span>
                        <h2 className="text-4xl font-black tracking-tighter text-indigo-400">{ledgerInfo.currentPfBalance.toLocaleString()}</h2>
                        <span className="text-[10px] font-black text-indigo-600 opacity-60">.00</span>
                     </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Next Contribution</span>
                        <span className="text-xs font-black text-slate-400">₹2,000.00 (Pending)</span>
                     </div>
                     <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Months Sync</span>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                           <CheckCircle2 size={10} /> {ledgerInfo.monthsElapsed} Months Logged
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Salary Ledger</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <History size={12} className="text-indigo-600" /> Official Financial Node Logs
                  </p>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Growth: +4.2%</span>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[850px]">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cycle & Month</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Pay</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Credited</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PF Portion</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flow Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Documentation</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {ledgerInfo.ledger.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-7">
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 uppercase tracking-tight">{item.month}</span>
                                 <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-1">REF: {item.ref}</span>
                              </div>
                           </td>
                           <td className="px-8 py-7">
                              <span className="text-sm font-bold text-slate-500">₹{item.gross.toLocaleString()}</span>
                           </td>
                           <td className="px-8 py-7">
                              <span className={`text-xl font-black tracking-tight ${item.status === 'Credited' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                 ₹{item.net.toLocaleString()}
                              </span>
                           </td>
                           <td className="px-8 py-7">
                              <span className="text-sm font-black text-slate-800">₹{item.pf.toLocaleString()}</span>
                           </td>
                           <td className="px-8 py-7">
                              <div className="flex items-center gap-2.5">
                                 <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'Credited' ? 'bg-emerald-500 shadow-lg shadow-emerald-100' :
                                    'bg-amber-400 animate-pulse'
                                    }`} />
                                 <div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Credited' ? 'text-emerald-600' : 'text-amber-600'
                                       }`}>{item.status}</span>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase truncate max-w-[100px]">{item.creditDate}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-7 text-center">
                              <button
                                 onClick={() => setActivePaySlip(item)}
                                 className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2 mx-auto"
                              >
                                 <FileText size={14} /> {item.status === 'Credited' ? 'View Slip' : 'Project Slip'}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {activePaySlip && (
            <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
               <div className="bg-[#fdfdfd] w-full max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[3.5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.6)] border-[12px] border-white relative animate-in slide-in-from-bottom-24 duration-700 flex flex-col">

                  <button
                     onClick={() => setActivePaySlip(null)}
                     className="absolute top-10 right-10 p-4 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all z-50 shadow-sm"
                  >
                     <X size={28} />
                  </button>

                  <div className="p-10 md:p-24 space-y-16 relative flex-1">
                     <div className="flex flex-col md:flex-row items-start justify-between gap-12 border-b-4 border-slate-900 pb-12">
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-slate-900 rounded-[1.75rem] flex items-center justify-center shadow-2xl">
                                 <span className="text-white font-black text-4xl">U</span>
                              </div>
                              <div>
                                 <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">UjjwalHUB</h1>
                                 <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em] mt-2">Municipal Service Advisor</p>
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Identity</p>
                              <p className="text-2xl font-black text-slate-900 uppercase mt-1">{user.username}</p>
                              <p className="text-sm font-mono font-black text-indigo-600 mt-1 uppercase tracking-widest">{user.employeeId}</p>
                           </div>
                        </div>
                        <div className="text-right flex flex-col md:items-end gap-3">
                           <div className="bg-slate-900 text-white px-7 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">{activePaySlip.month}</div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statement Node: #{activePaySlip.ref}</p>
                           <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mt-4">
                              {activePaySlip.status === 'Credited' ? 'Official Payroll Record' : 'Provisional Cycle Forecast'}
                           </p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="space-y-10">
                           <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-4 flex items-center gap-2">
                              <IndianRupee size={16} className="text-indigo-600" /> Fixed Earnings Components
                           </h4>
                           <div className="space-y-8">
                              <div className="flex justify-between items-center group/item">
                                 <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Monthly Base Salary</span>
                                 <span className="text-base font-black text-slate-800">₹34,000.00</span>
                              </div>
                              <div className="flex justify-between items-center group/item opacity-40">
                                 <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Incentive Credits</span>
                                 <span className="text-base font-black text-slate-800">₹0.00</span>
                              </div>
                              <div className="flex justify-between items-center pt-8 border-t border-slate-100 font-black">
                                 <span className="text-sm uppercase tracking-widest text-slate-900">Total Gross Amount</span>
                                 <span className="text-xl">₹34,000.00</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-10">
                           <h4 className="text-sm font-black text-red-600 uppercase tracking-[0.2em] border-b border-slate-200 pb-4 flex items-center gap-2">
                              <AlertCircle size={16} /> Performance Deductions
                           </h4>
                           <div className="space-y-8">
                              <div className="flex justify-between items-center">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">PF Statutory Cut-off</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fixed Monthly Contribution</span>
                                 </div>
                                 <span className="text-base font-black text-red-500">- ₹2,000.00</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Task Penalty ({activePaySlip.incomplete} Units)</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">₹100 Per Incomplete Node</span>
                                 </div>
                                 <span className="text-base font-black text-red-500">- ₹{(activePaySlip.incomplete * 100).toLocaleString()}.00</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Leave Penalty ({activePaySlip.leaves} Approved)</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Administrative Grid Deductions</span>
                                 </div>
                                 <span className="text-base font-black text-red-500">- ₹{(activePaySlip.leaves * 500).toLocaleString()}.00</span>
                              </div>
                              <div className="flex justify-between items-center pt-8 border-t border-slate-100 font-black">
                                 <span className="text-sm uppercase tracking-widest text-red-600">Total Deductions</span>
                                 <span className="text-xl text-red-600">₹{(2000 + (activePaySlip.incomplete * 100) + (activePaySlip.leaves * 500)).toLocaleString()}.00</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150"><Banknote size={120} /></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                           <div className="space-y-3 text-center md:text-left">
                              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-300">
                                 {activePaySlip.status === 'Credited' ? 'Net Disbursement Credited' : 'Projected Net Disbursement'}
                              </p>
                              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                                 <span className="text-4xl font-black text-indigo-400">₹</span>
                                 <h2 className="text-7xl font-black tracking-tighter tabular-nums">{activePaySlip.net.toLocaleString()}</h2>
                                 <span className="text-xl font-black text-indigo-400">.00</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/10 p-6 rounded-3xl border border-white/10 text-center min-w-[160px] backdrop-blur-sm">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-2">PF Contribution</p>
                                 <p className="text-lg font-black tracking-tight">₹2,000.00</p>
                              </div>
                              <div className="bg-white/10 p-6 rounded-3xl border border-white/10 text-center min-w-[160px] backdrop-blur-sm">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-2">Cycle Status</p>
                                 <p className="text-lg font-black tracking-tight uppercase">{activePaySlip.status}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-end justify-between pt-16 border-t-2 border-dashed border-slate-200 gap-10">
                        <div className="flex flex-col items-start">
                           <div className="mb-2">
                              <p className="text-4xl font-bold text-slate-900 leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>
                                 Sachin Jhawar
                              </p>
                           </div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Authorized Director</p>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ujjwal Hub Directorate</p>
                        </div>
                        <div className="shrink-0 flex items-center justify-center">
                           <OfficialInstitutionalStamp />
                        </div>
                     </div>

                     <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 space-y-2 text-center md:text-left">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">Cryptographic Node Seal</p>
                           <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[8px] text-slate-400 break-all leading-relaxed">
                              SHA256: 4E9A8F2C1B0D7E5F3A2C4E9A8F2C1B0D7E5F3A2C4E9A8F2C1B0D7E5F3A2C4E9A
                           </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em] text-center md:text-right max-w-xs">
                           This is an automated system audit compliant with Act 1949. No physical stamp required beyond system verification.
                        </p>
                     </div>

                     <div className="flex flex-wrap items-center justify-center gap-5 pt-12 border-t border-slate-100 print:hidden">
                        <button className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all">
                           <Download size={20} /> Download PDF
                        </button>
                        <button className="flex items-center gap-4 px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:shadow-lg transition-all active:scale-95">
                           <Share2 size={20} /> Share Record
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-4 px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:shadow-lg transition-all active:scale-95">
                           <Printer size={20} /> Print Statement
                        </button>
                     </div>

                     <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pt-4"> Registry Ref: {activePaySlip.ref}-{Date.now()} • NODE: CHENNAI-ADMIN-01</p>
                  </div>
               </div>
            </div>
         )}

         <div className="mt-auto text-center py-12 space-y-5">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">Financial Registry ID: {user.employeeId}-2026-FIB</p>
            <div className="flex items-center justify-center gap-10 opacity-30">
               <span className="text-[9px] font-black uppercase tracking-widest">Act 1949 Compliant</span>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
               <span className="text-[9px] font-black uppercase tracking-widest">Secure Bank Sync Active</span>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
               <span className="text-[9px] font-black uppercase tracking-widest">Zonal Audit Clear</span>
            </div>
         </div>
      </div>
   );
};
