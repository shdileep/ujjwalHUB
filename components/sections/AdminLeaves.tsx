
import React, { useState, useMemo } from 'react';
import { AppState, LeaveRequest } from '../../types';
import { databaseService } from '../../services/database.service';
import {
   CalendarDays, CheckCircle2, Clock, XCircle,
   User, Phone, Hash, MessageSquare, Send,
   ChevronRight, Filter, Calendar, Clock4, Search
} from 'lucide-react';

interface Props {
   state: AppState;
   updateState: (updates: Partial<AppState>) => void;
}

export const AdminLeaves: React.FC<Props> = ({ state, updateState }) => {
   const [remarks, setRemarks] = useState<Record<string, string>>({});
   const [searchTerm, setSearchTerm] = useState('');

   const filteredLeaves = useMemo(() => {
      if (!state.user || state.user.role !== 'admin') return state.leaves;
      const adminLoc = (state.user?.location || 'Kandigai').toLowerCase(); // FALLBACK: Default to Kandigai if location missing
      if (adminLoc === 'total' || adminLoc === 'chennai') return state.leaves;

      return state.leaves.filter(l => {
         if (!l.area) return true; // RESILIENCE: Show legacy leaves to all admins
         const driverArea = (l.area || '').toLowerCase();
         // Handle Kandigai sub-areas if necessary
         if (adminLoc === 'kandigai') {
            return driverArea === 'kandigai' || ['melakottaiyur', 'nallambakkam'].includes(driverArea);
         }
         if (adminLoc === 'west chengalpattu') {
            const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur', 'west chengalpattu'];
            return WCP_SUB_AREAS.some(sa => driverArea.includes(sa));
         }
         return driverArea === adminLoc;
      });
   }, [state.leaves, state.user]);

   const stats = useMemo(() => ({
      total: filteredLeaves.length,
      pending: filteredLeaves.filter(l => l.status === 'Pending').length,
      approved: filteredLeaves.filter(l => l.status === 'Approved').length,
   }), [filteredLeaves]);

   const pendingRequests = useMemo(() => {
      return filteredLeaves.filter(l => l.status === 'Pending');
   }, [filteredLeaves]);

   const history = useMemo(() => {
      return filteredLeaves.filter(l => l.status !== 'Pending' &&
         ((l.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.driverId || '').toLowerCase().includes(searchTerm.toLowerCase()))
      );
   }, [filteredLeaves, searchTerm]);

   const handleAction = (id: string, status: 'Approved' | 'Rejected') => {
      const adminRemarks = remarks[id] || (status === 'Approved' ? 'Leave Approved' : 'Rejected by Admin');
      const updated = state.leaves.map(l =>
         l.id === id ? { ...l, status, adminRemarks } : l
      );
      const getLeaveStatus = (type?: string): 'On Leave' | 'Emergency' | 'Hourly' => {
         if (type === 'Emergency') return 'Emergency';
         if (type === 'Hourly') return 'Hourly';
         return 'On Leave';
      };

      updateState({ leaves: updated });

      // Persist to Firebase
      databaseService.updateLeaveRequest(id, { status, adminRemarks }).catch(console.error);

      // v11: Sync with Daily Record for immediate Dashboard update
      const leave = state.leaves.find(l => l.id === id);
      if (leave && status === 'Approved') {
         databaseService.updateDailyRecord({
            driverId: leave.driverId,
            driverName: leave.driverName || 'Unknown',
            date: leave.fromDate || new Date().toISOString().split('T')[0],
            leaveStatus: getLeaveStatus(leave.type),
            leaveRequestId: leave.id
         }).catch(console.error);
      }

      setRemarks(prev => {
         const next = { ...prev };
         delete next[id];
         return next;
      });
   };

   return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-20">
         {/* Summary Section */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                  <CalendarDays size={100} />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Total Fleet Applications</p>
               <h3 className="text-4xl font-black text-slate-900">{stats.total}</h3>
            </div>
            <div className="bg-amber-600 p-8 rounded-[3rem] text-white shadow-xl shadow-amber-100 relative overflow-hidden">
               <p className="text-[10px] font-black text-amber-200 uppercase tracking-[0.4em] mb-4">Awaiting Review</p>
               <h3 className="text-4xl font-black">{stats.pending}</h3>
            </div>
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
               <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.4em] mb-4">Finalized Approvals</p>
               <h3 className="text-4xl font-black">{stats.approved}</h3>
            </div>
         </div>

         {/* Pending Requests Grid */}
         <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Applications</h2>
               <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Clock size={14} className="animate-pulse" /> Real-time Queue
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                              {(req.driverName || 'U').charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-slate-900">{req.driverName}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{req.driverId} • {req.phone}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{req.id}</p>
                           <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 border ${req.type === 'Emergency' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                              {req.type}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={12} /> Duration</p>
                           <p className="text-sm font-black text-slate-800 leading-tight">
                              {req.fromDate} {req.type === 'Hourly' ? '' : `to ${req.toDate}`}
                           </p>
                        </div>
                        {req.type === 'Hourly' && (
                           <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock4 size={12} /> Window</p>
                              <p className="text-sm font-black text-indigo-600 leading-tight">{req.fromTime} – {req.toTime}</p>
                           </div>
                        )}
                     </div>

                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Applicant's Reason</p>
                        <p className="text-sm font-bold text-slate-700 italic">"{req.reason}"</p>
                     </div>

                     <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="relative">
                           <MessageSquare className="absolute left-4 top-4 text-slate-300" size={18} />
                           <textarea
                              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-[2rem] outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 font-bold text-slate-700 transition-all resize-none h-20"
                              placeholder="Add remarks or rejection cause..."
                              value={remarks[req.id] || ''}
                              onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <button
                              onClick={() => handleAction(req.id, 'Rejected')}
                              className="py-5 bg-white border-2 border-slate-100 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                           >
                              <XCircle size={16} /> Reject
                           </button>
                           <button
                              onClick={() => handleAction(req.id, 'Approved')}
                              className="py-5 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                           >
                              <CheckCircle2 size={16} /> Approve
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
               {pendingRequests.length === 0 && (
                  <div className="lg:col-span-2 py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 opacity-60">
                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} className="text-slate-200" />
                     </div>
                     <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">Queue Clear</h4>
                     <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mt-2">All leave applications processed</p>
                  </div>
               )}
            </div>
         </div>

         {/* Audit Log / History */}
         <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet History Table</h2>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search by ID or Name..."
                     className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-slate-700 shadow-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver Name</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Leave Scope</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Window</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Metadata</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {history.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-6">
                              <div className="flex flex-col min-w-[150px]">
                                 <span className="text-sm font-black text-slate-800">
                                    {item.driverName && item.driverName !== 'N/A' && item.driverName !== 'Unknown'
                                       ? item.driverName
                                       : (state.driversHub.find(d => d.driverId === item.driverId)?.personnelIdentity.name ||
                                          state.drivers.find(d => d.employeeId === item.driverId || d.driverId === item.driverId)?.username ||
                                          item.driverName || 'N/A')}
                                 </span>
                                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{item.driverId} • {item.phone}</span>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-slate-700">{item.id}</span>
                                 <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${item.type === 'Emergency' ? 'text-red-500' : 'text-slate-400'
                                    }`}>{item.type}</span>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex flex-col text-[10px] font-bold text-slate-500 min-w-[120px]">
                                 <span>{item.fromDate} {item.fromTime && `| ${item.fromTime}`}</span>
                                 {item.type !== 'Hourly' && <span>to {item.toDate}</span>}
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${item.status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'Approved' ? 'text-emerald-600' : 'text-red-500'
                                    }`}>{item.status}</span>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="min-w-[180px]">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Remarks</p>
                                 <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{item.adminRemarks || 'N/A'}"</p>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {history.length === 0 && (
                        <tr>
                           <td colSpan={5} className="py-20 text-center text-slate-200">
                              <Filter size={40} className="mx-auto mb-4 opacity-10" />
                              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Audit Trail Empty</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
