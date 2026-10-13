
import React, { useMemo, useState, useEffect } from 'react';
import { AppState, LiveDriverStatus, LeaveRequest, Bin, TaskProTask } from '../../types';
import {
  Download, Printer, FileText, Calendar, Clock,
  MapPin, Phone, Mail, User, ShieldCheck, Megaphone, Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import { DynamicLogo } from '../DynamicLogo';
import { KANDIGAI_BINS } from '../../constants/kandigaiData';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { calculateDriverMetrics, getHistoricalMetrics } from '../../utils/metrics';
import { getSpecialAreaBins } from '../../utils/binRandomizer';

const OfficialSealedStamp = () => (
  <div className="relative w-40 h-40 flex items-center justify-center select-none opacity-90 transition-all">
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

// Tamil Nadu public holidays 2026 (ISO date strings)
const HOLIDAYS_2026 = [
  '2026-01-01', // New Year's Day
  '2026-01-14', // Pongal
  '2026-01-15', // Thiruvalluvar Day
  '2026-01-16', // Uzhavar Thirunal
  '2026-01-26', // Republic Day
  '2026-02-15', // Maha Shivaratri
  '2026-03-20', // Holi / Spring Equinox
  '2026-04-01', // Tamil New Year
  '2026-04-10', // Good Friday
  '2026-04-14', // Ambedkar Jayanti
  '2026-05-01', // Labour Day
  '2026-05-22', // Buddha Purnima
  '2026-06-17', // Eid al-Adha
  '2026-07-17', // Muharram
  '2026-08-15', // Independence Day
  '2026-08-22', // Onam
  '2026-09-07', // Milad-un-Nabi
  '2026-10-02', // Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-04', // Diwali
  '2026-11-14', // Ayudha Puja
  '2026-12-25', // Christmas
];

interface Props {
  state: AppState;
}

export const DriverOverview: React.FC<Props> = ({ state }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const user = state.user;
  const currentDriver = state.drivers.find(d => d.employeeId === user?.employeeId);

  const metrics = useMemo(() => {
    // If user not yet loaded, return safe defaults
    if (!user) return {
      todayCompleted: 0, todayIncomplete: 0, currentTaskCount: 0,
      driverLeaves: [], todayAssigned: 0, approvedLeavesCount: 0,
      rejectedLeavesCount: 0, febTotalTasks: 0, section1Header: '',
      liveActionableBins: 0, pendingTasksList: [],
      liveNetSalary: 32000,
      lastMonthMetrics: { leaves: 0, pending: 0, taskPenalty: 0, leavePenalty: 0, netCredited: 32000, totalCompletedTasks: 0, monthName: '', fullMonthName: '', year: 2026 },
      todayStr: '', yesterdayStr: ''
    };

    let allBins = state.bins && state.bins.length > 0 ? state.bins : [];
    if (user.location === 'Kandigai') {
      // Merge static definitions with live Firebase states
      allBins = KANDIGAI_BINS.map(b => {
        const liveBin = state.bins?.find(lb => lb.id === b.id);
        return liveBin ? { ...b, ...liveBin } : b;
      });
    } else if (user.location && user.location !== 'Total' && user.location !== 'Chennai') {
      const allowedComponents = AREA_COMPONENT_MAPPING[user.location];
      if (allowedComponents) {
        let filtered = state.bins.filter(b => {
          if (user.location === 'West Chengalpattu') {
            const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur', 'west chengalpattu'];
            const bArea = (b.areaName || '').toLowerCase();
            const bLoc = (b.locationName || '').toLowerCase();
            return WCP_SUB_AREAS.some(sa => bLoc.includes(sa) || bArea.includes(sa));
          }
          if (user.location === 'Adambakkam') return b.areaName === 'Adambakkam' || b.locationName === 'Adambakkam';
          const userLocNormalized = user.location.trim().toLowerCase();
          if (userLocNormalized === 'kandigai') return (b.areaName || '').toLowerCase() === 'kandigai' || ['melakottaiyur', 'nallambakkam', 'kandigai'].includes((b.locationName || '').toLowerCase());
          return allowedComponents.some(c => (b.areaName && c.toLowerCase() === b.areaName.toLowerCase()) || c.toLowerCase() === b.locationName.toLowerCase());
        });

        // Ensure static Kandigai bins are included if the area mapping suggests it
        if (allowedComponents.some(c => c.toLowerCase() === 'kandigai')) {
          const kandigaiMerged = KANDIGAI_BINS.map(b => {
            const liveBin = state.bins?.find(lb => lb.id === b.id);
            return liveBin ? { ...b, ...liveBin } : b;
          });
          // Avoid duplicates
          const filterIds = new Set(filtered.map(b => b.id));
          const union = [...filtered, ...kandigaiMerged.filter(b => !filterIds.has(b.id))];
          filtered = union;
        }

        if (user.location !== 'Adambakkam' && user.location !== 'West Chengalpattu' && user.location !== 'Kandigai' && filtered.length > 0) {
          filtered = getSpecialAreaBins(filtered, user.location);
        }
        allBins = filtered;
      }
    } else if (!user.location || user.location === 'Total' || user.location === 'Chennai') {
      // Total view: Merge all live bins + all static Kandigai bins (merged)
      const mergedKandigai = KANDIGAI_BINS.map(b => {
        const liveBin = state.bins.find(lb => lb.id === b.id);
        return liveBin ? { ...b, ...liveBin } : b;
      });
      const kandigaiIds = new Set(KANDIGAI_BINS.map(b => b.id));
      const otherBins = state.bins.filter(b => !kandigaiIds.has(b.id));
      allBins = [...mergedKandigai, ...otherBins];
    }

    const driverBins = allBins;
    const currentEmployeeId = (user.employeeId || '').trim().toLowerCase();
    const driverLeaves = state.leaves.filter(l => (l.driverId || '').trim().toLowerCase() === currentEmployeeId);

    // Standardized Metrics (Matching DriverTasks.tsx)
    const driverBinsFiltered = driverBins.filter(b => {
      if (b.assignedDriverId) return (b.assignedDriverId || '').trim().toLowerCase() === currentEmployeeId;
      return true; // Fallback for unassigned (though redistribution fixes this)
    });

    const todayCompleted = driverBinsFiltered.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
    const todayAssigned = driverBinsFiltered.length;
    const todayIncomplete = todayAssigned - todayCompleted;
    const currentTaskCount = todayIncomplete; // To-do tasks

    const approvedLeaves = driverLeaves.filter(l => l.status === 'Approved');
    const rejectedLeaves = driverLeaves.filter(l => l.status === 'Rejected');

    // WORKING DAY CALCULATOR EXCLUDING SUNDAYS & SPECIFIC HOLIDAYS
    const getValidWorkingDays = (startDate: Date, endDate: Date, explicitHolidays: string[] = []) => {
      let days = 0;
      let iterateDate = new Date(startDate);
      iterateDate.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      while (iterateDate <= end) {
        const dStr = iterateDate.toISOString().split('T')[0];
        const isSun = iterateDate.getDay() === 0;
        const isHol = explicitHolidays.includes(dStr);
        if (!isSun && !isHol && iterateDate <= new Date()) {
          days++;
        }
        iterateDate.setDate(iterateDate.getDate() + 1);
      }
      return days;
    };

    // ── DYNAMIC CURRENT-MONTH CONTINUOUS TASK SUMMARY ──────────────────────
    const trueNow = new Date();
    const yesterday = new Date(trueNow);
    yesterday.setDate(yesterday.getDate() - 1);

    // Start of the current calendar month
    const monthStart = new Date(trueNow.getFullYear(), trueNow.getMonth(), 1);

    // Count valid working days from monthStart → yesterday (excl. Sundays & holidays)
    const continuousWorkingDays = getValidWorkingDays(monthStart, yesterday, HOLIDAYS_2026);

    // At exactly 11:59 PM today, today's 38 tasks are added automatically.
    // We check: if current time is 23:59 or later, add today's tasks too.
    const isAfter2359 = trueNow.getHours() === 23 && trueNow.getMinutes() >= 59;
    const todayIsWorkingDay = trueNow.getDay() !== 0 && !HOLIDAYS_2026.includes(trueNow.toISOString().split('T')[0]);
    const bonusTasks = isAfter2359 && todayIsWorkingDay ? 38 : 0;
    const continuousTotalTasks = continuousWorkingDays * 38 + bonusTasks;

    // Header date strings for Section 1
    const section1MonthName = monthStart.toLocaleDateString('en-US', { month: 'long' });
    const section1YesterdayStr = yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const section1Header = `${section1MonthName} 01 – ${section1YesterdayStr}`;

    // ── TODAY'S LIVE ACTIVITY ─────────────────────────────────────────────────
    // Count Half Full + Full bins from the driver's own bin pool (live from Tasks page)
    const liveActionableBins = driverBinsFiltered.filter(b => {
      const s = (b.status || '').toLowerCase().trim();
      return s === 'full' || s === 'half full' || s === 'half-full';
    }).length;

    // PENDING TASKS LIST
    const pendingTasksList = driverBins.filter(b => b.status !== 'Completed' && b.status !== 'Empty');

    // LIVE SALARY — use the same shared formula as DriverPayments page
    const salaryMetrics = calculateDriverMetrics(
      { employeeId: user.employeeId, driverId: user.employeeId } as any,
      state.bins,
      state.leaves
    );
    const liveNetSalary = salaryMetrics.netSalary;

    // HISTORICAL SIMULATION DATA for last month
    const currentDate = new Date();
    // Setting date to 0 gets exactly the last day of the previous calendar month
    const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const lastMonthMetrics = getHistoricalMetrics(lastMonthDate);

    return {
      todayCompleted,
      todayIncomplete,
      currentTaskCount,
      driverLeaves,
      todayAssigned,
      approvedLeavesCount: approvedLeaves.length,
      rejectedLeavesCount: rejectedLeaves.length,
      febTotalTasks: continuousTotalTasks,
      section1Header,
      liveActionableBins,
      pendingTasksList,
      liveNetSalary,
      lastMonthMetrics,
      todayMonthDate: trueNow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      todayStr: trueNow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      yesterdayStr: yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  }, [state.bins, state.leaves, currentDriver, user?.employeeId, now]);

  // Null guard after all hooks — safe early return if user hasn't loaded yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest">Loading Profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 md:py-12 px-4 sm:px-6 space-y-12 pb-24 print:bg-white print:p-0">

      {/* ACTION BAR */}
      <div className="max-w-[210mm] w-full flex flex-col sm:flex-row justify-between items-center bg-white p-6 shadow-sm border border-slate-200 z-20 gap-6 print:hidden rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center shadow-lg shrink-0 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Driver's Executive Portfolio</h3>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div> Live Synchronization Active
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => window.print()} className="flex-1 sm:flex-none px-5 py-3 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 rounded-xl">
            <Printer size={14} /> Print
          </button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none px-5 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl rounded-xl">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] w-full bg-white shadow-2xl border border-slate-300 rounded-none relative overflow-hidden flex flex-col min-h-[297mm] p-10 md:p-16 print:p-12 print:border-none print:shadow-none">

        {/* HEADER: Official Image Banner */}
        <div className="w-full pb-8 mb-8 border-b border-indigo-100 flex justify-center">
          <img src="/driver-header-logo.png" alt="Official Header" className="h-24 w-auto object-contain mx-auto" />
        </div>

        {/* IDENTITY BLOCK: Photo Left, Details Right */}
        <div className="flex flex-col md:flex-row gap-10 items-stretch mb-12">
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-56 h-64 bg-slate-100 border-4 border-slate-900 shadow-xl overflow-hidden grayscale-[50%] relative group transition-all duration-500 hover:grayscale-0">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl font-black text-slate-200">{user.username.charAt(0)}</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-white p-2 text-center text-[10px] font-black uppercase tracking-[0.3em]">
                {user.employeeId}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-6">{user.username}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Email</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{user.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</p>
                  <p className="text-sm font-bold text-slate-900">{user.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Employment</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">Full-Time Base</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Working Hub</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{user.location || 'Chennai Base'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joined Date</p>
                  <p className="text-sm font-bold text-slate-900 uppercase font-mono">01 DEC 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Driver ID</p>
                  <p className="text-sm font-black text-indigo-700 uppercase">{user.employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLES SECTION */}
        <div className="space-y-12">

          {/* 1. Aggregated Live Objective Routine – updated per spec */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <Activity size={14} className="text-indigo-600" /> Aggregated Live Objective Routine
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-800">

                {/* ── Section 1: Continuous Task Summary ── */}
                <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-4 border-b border-slate-200" colSpan={3}>
                      {/* Removed Section Header Text */}
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 pb-3 border-b border-slate-200">Date Range</th>
                    <th className="px-4 pb-3 border-b border-slate-200 text-center">Unit Count</th>
                    <th className="px-4 pb-3 border-b border-slate-200 text-right">Synchronization Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr className="hover:bg-slate-50 transition-colors">
                    {/* Dynamic: «Month» 01 – «Month» «Yesterday's Date» */}
                    <td className="p-4 text-slate-700">{metrics.section1Header}</td>
                    <td className="p-4 text-center text-indigo-600 font-black text-sm">{metrics.febTotalTasks}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-1.5 text-indigo-500">
                      <Activity size={14} /> Live (Always)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">{metrics.todayMonthDate}</td>
                    <td className="p-4 text-center text-amber-600 font-black text-sm">{metrics.liveActionableBins}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-1.5 text-amber-500">
                      <AlertCircle size={14} /> Real-Time
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-4 text-slate-900 font-black border-t-2 border-slate-200">Completed Tasks Today</td>
                    <td className="p-4 text-center font-black text-emerald-600 text-lg border-t-2 border-slate-200">
                      {metrics.todayCompleted}
                    </td>
                    <td className="p-4 text-right text-emerald-500 text-[10px] uppercase border-t-2 border-slate-200">
                      <CheckCircle2 size={12} className="inline mr-1" />Completed
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Removing Pending Tasks Console per user request (reduced to just 3 tables) */}

          {/* 2. Leaves & Live Payroll Synchronization Table */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <Calendar size={14} className="text-indigo-600" /> {new Date().toLocaleDateString('en-US', { month: 'long' })}'s Employee Leave & Live Payroll Registry
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Metric Description</th>
                    <th className="p-4 border-b border-slate-200 text-center">Approved Logs</th>
                    <th className="p-4 border-b border-slate-200 text-center text-red-500">Rejected Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr>
                    <td className="p-4 text-slate-600">Monthly Leaves Applied</td>
                    <td className="p-4 text-center text-emerald-600">{metrics.approvedLeavesCount} Approved</td>
                    <td className="p-4 text-center text-red-500">{metrics.rejectedLeavesCount} Tickets</td>
                  </tr>
                  <tr className="bg-indigo-50/50">
                    <td className="p-4 text-indigo-900 font-black">Live Projected Salary Calculation</td>
                    <td className="p-4 text-center text-indigo-700 font-black text-lg border-x border-indigo-100/50">
                      ₹{metrics.liveNetSalary.toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-indigo-500 text-[10px] uppercase">
                      <Activity size={12} className="inline mr-1 animate-pulse" /> Live Sync
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Preceding Month Database */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} className="text-indigo-600" /> Last Month's Records ({metrics.lastMonthMetrics.monthName})
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Historical Metric</th>
                    <th className="p-4 border-b border-slate-200 text-center">Status / Count</th>
                    <th className="p-4 border-b border-slate-200 text-right">Payroll Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">Complete</td>
                    <td className="p-4 text-center text-emerald-600 font-black text-sm">{metrics.lastMonthMetrics.totalCompletedTasks} Total Completed Tasks</td>
                    <td className="p-4 text-right text-slate-400 uppercase text-[10px]">Registry Locked</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">Pending Operations</td>
                    <td className="p-4 text-center text-amber-600 font-black text-sm">{metrics.lastMonthMetrics.pending} Tasks Incomplete</td>
                    <td className="p-4 text-right text-rose-500 uppercase text-[10px] whitespace-nowrap">-₹{metrics.lastMonthMetrics.taskPenalty.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">Leaves Total Approved</td>
                    <td className="p-4 text-center text-amber-600 font-black text-sm">{metrics.lastMonthMetrics.leaves} Leaves</td>
                    <td className="p-4 text-right text-rose-500 uppercase text-[10px] whitespace-nowrap">-₹{metrics.lastMonthMetrics.leavePenalty.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 transition-colors">
                    <td className="p-4 text-slate-900 font-black">Last Month Salary</td>
                    <td className="p-4 text-center text-slate-900 font-black text-sm">Net Credited</td>
                    <td className="p-4 text-right text-emerald-600 font-black text-lg">₹{metrics.lastMonthMetrics.netCredited.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Removing Historical Log as directed per requirements */}

          {/* SEAL AND SIGNATURE FOOTER */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-end justify-between gap-10">
            {/* LEFT BOTTOM - AUTHORIZED SIGNATURE */}
            <div className="flex flex-col items-start">
              <div className="mb-2">
                <p className="text-4xl font-bold text-slate-900 leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Sachin Jhawar
                </p>
              </div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Authorized Director</p>
            </div>

            {/* RIGHT BOTTOM - OFFICIAL UJJWALHUB STAMP */}
            <div className="shrink-0 flex items-center justify-center">
              <OfficialSealedStamp />
            </div>
          </div>

        </div>

        {/* PAGE 2: SECONDARY FLYER (EVENTS & TENDERS) */}
        <div className="max-w-[210mm] w-full bg-white shadow-2xl border border-slate-300 rounded-none relative overflow-hidden flex flex-col p-10 md:p-16 mt-8 print:mt-12 print:break-before-page print:border-none print:shadow-none">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8 pb-4 border-b-2 border-slate-900">
            Ujjwal Hub Communications & Operations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Events Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8">
              <h4 className="text-xs font-black text-indigo-800 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <Megaphone size={16} /> Upcoming Municipal Tenders & Projects
              </h4>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 uppercase leading-snug">Swachh Bharath Special Review 2026</p>
                    <p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">Expected Date: March 2nd Week</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 uppercase leading-snug">Zone Expansion Fleet Tender (Phase 3)</p>
                    <p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">Procurement Node: Active Bidding</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Operation Manager Card Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <ShieldCheck size={200} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-xl">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-widest text-white mb-1">Shubhamraj</h4>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-900/50 rounded-full inline-block">Operation Manager</p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4 border-t border-white/10 w-full mt-4">
                  Primary Contact For Dispatch & Route Administration
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
