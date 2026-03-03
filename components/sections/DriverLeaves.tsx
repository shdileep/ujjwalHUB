
import React, { useState, useMemo } from 'react';
import { AppState, LeaveRequest, Notification } from '../../types';
import { databaseService } from '../../services/database.service';
import { GoogleGenAI } from "@google/genai";
import {
  CalendarDays, CheckCircle2, Clock, AlertCircle, Plus,
  X, FileText, Send, Sparkles, Calendar,
  Clock4, Loader2, ListFilter, MessageSquare, History, Key
} from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export const DriverLeaves: React.FC<Props> = ({ state, updateState }) => {
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'Normal' | 'Emergency' | 'Hourly'>('Normal');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [fromTime, setFromTime] = useState({ hour: '08', minute: '00', period: 'AM' });
  const [toTime, setToTime] = useState({ hour: '10', minute: '00', period: 'AM' });

  const [isCorrecting, setIsCorrecting] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  const driverLeaves = useMemo(() => {
    const currentId = (state.user?.employeeId || '').trim().toLowerCase();
    return state.leaves.filter(l => (l.driverId || '').trim().toLowerCase() === currentId);
  }, [state.leaves, state.user]);

  const stats = useMemo(() => ({
    pending: driverLeaves.filter(l => l.status === 'Pending').length,
    approved: driverLeaves.filter(l => l.status === 'Approved').length,
  }), [driverLeaves]);

  // Date Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const generateLeaveId = () => {
    const month = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${month}${random}`;
  };

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setShowKeyPrompt(false);
  };

  const handleCorrectReason = async () => {
    if (!reason.trim()) return;
    setIsCorrecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // OPTIMIZED FOR FLASH SPEED: Strictly instructions for speed and no thinking
      const prompt = `Act as a professional administrative coordinator. Correct grammar and sentence structure for this municipal driver leave reason. Keep it professional, concise, and in first-person. Output ONLY the corrected text, without introductory filler or quotes. Input: "${reason}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 } // Ultra-fast response
        }
      });
      if (response.text) {
        setReason(response.text.trim());
      }
    } catch (error: any) {
      console.error("AI Correction failed", error);
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('Requested entity was not found')) {
        setShowKeyPrompt(true);
      }
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleApply = () => {
    // Hourly logic validation
    if (leaveType === 'Hourly') {
      const fH = parseInt(fromTime.hour) + (fromTime.period === 'PM' && fromTime.hour !== '12' ? 12 : 0);
      const tH = parseInt(toTime.hour) + (toTime.period === 'PM' && toTime.hour !== '12' ? 12 : 0);
      const diff = (tH + (parseInt(toTime.minute) / 60)) - (fH + (parseInt(fromTime.minute) / 60));

      if (diff > 4 || diff <= 0) {
        alert("Hourly leave must be positive and cannot exceed 4 hours.");
        return;
      }

      const now = new Date();
      const selectedStart = new Date();
      selectedStart.setHours(fH, parseInt(fromTime.minute), 0);

      const oneHourAgo = new Date();
      oneHourAgo.setHours(now.getHours() - 1);

      if (selectedStart < oneHourAgo) {
        alert("Hourly leave cannot start more than 1 hour in the past.");
        return;
      }
    }

    const timestamp = new Date().toLocaleString();
    const newRequest: LeaveRequest = {
      id: generateLeaveId(),
      driverId: state.user?.employeeId || 'Unknown',
      driverName: state.user?.username || 'Unknown',
      area: state.user?.location || 'Unknown', // ADDED: Include driver's area for admin filtering
      phone: state.user?.phone || 'Unknown',
      type: leaveType,
      fromDate: leaveType === 'Hourly' ? todayStr : fromDate,
      toDate: leaveType === 'Hourly' ? todayStr : toDate,
      fromTime: leaveType === 'Hourly' ? `${fromTime.hour}:${fromTime.minute} ${fromTime.period}` : undefined,
      toTime: leaveType === 'Hourly' ? `${toTime.hour}:${toTime.minute} ${toTime.period}` : undefined,
      reason,
      status: 'Pending',
      timestamp: timestamp
    };

    const activityNotif: Notification = {
      id: 'LEAVE-' + Date.now(),
      message: `Driver ${state.user?.username} applied for ${leaveType} leave. Reason: ${reason}.`,
      timestamp: timestamp,
      type: 'activity',
      read: false
    };

    updateState({
      leaves: [newRequest, ...state.leaves],
      notifications: [activityNotif, ...state.notifications]
    });

    // Persist to Firebase
    databaseService.createLeaveRequest(newRequest).catch(console.error);
    databaseService.createNotification(activityNotif).catch(console.error);

    // Sync to new unified 'leave' node (Daily Audit)
    databaseService.updateDailyRecord({
      driverId: state.user?.employeeId || 'Unknown',
      driverName: state.user?.username || 'Unknown',
      date: newRequest.fromDate || todayStr,
      leaveStatus: leaveType === 'Normal' ? 'On Leave' : leaveType,
      leaveRequestId: newRequest.id,
      tasksCompleted: 0 // Will be updated by task completion logic
    }).catch(console.error);

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setReason('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500 px-4">
      {showKeyPrompt && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Key size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Quota Exhausted</h3>
            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">Professional grammar correction requires a valid personal API key due to high demand. Please select your key to continue.</p>
            <button onClick={handleSelectKey} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mb-4">Select API Key</button>
            <button onClick={() => setShowKeyPrompt(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Continue with original text</button>
          </div>
        </div>
      )}

      {/* Stat Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pending</p>
            <p className="text-2xl font-black text-slate-800">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Approved</p>
            <p className="text-2xl font-black text-slate-800">{stats.approved}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management</h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1">Field Force Protocol</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Apply New Leave
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-12 duration-500 relative">
            <button onClick={resetForm} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-all">
              <X size={24} />
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <FileText size={28} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Leave Application</h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-2">Official Digital Submission</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Type of Leave</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Emergency', 'Hourly'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setLeaveType(type); setFromDate(''); setToDate(''); }}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${leaveType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {leaveType !== 'Hourly' ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">From Date</label>
                    <input
                      type="date"
                      min={leaveType === 'Normal' ? tomorrowStr : todayStr}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        if (toDate && e.target.value > toDate) setToDate(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">To Date</label>
                    <input
                      type="date"
                      min={fromDate || (leaveType === 'Normal' ? tomorrowStr : todayStr)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-indigo-600" />
                      <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Applying for Today</span>
                    </div>
                    <span className="text-sm font-black text-indigo-900">{todayStr}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Clock4 size={10} /> Start Time</label>
                      <div className="flex gap-1.5">
                        <select className="flex-1 bg-slate-50 p-3 rounded-xl text-xs font-black outline-none border border-slate-100" value={fromTime.hour} onChange={e => setFromTime({ ...fromTime, hour: e.target.value })}>
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select className="flex-1 bg-slate-50 p-3 rounded-xl text-xs font-black outline-none border border-slate-100" value={fromTime.period} onChange={e => setFromTime({ ...fromTime, period: e.target.value })}>
                          <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Clock4 size={10} /> End Time</label>
                      <div className="flex gap-1.5">
                        <select className="flex-1 bg-slate-50 p-3 rounded-xl text-xs font-black outline-none border border-slate-100" value={toTime.hour} onChange={e => setToTime({ ...toTime, hour: e.target.value })}>
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select className="flex-1 bg-slate-50 p-3 rounded-xl text-xs font-black outline-none border border-slate-100" value={toTime.period} onChange={e => setToTime({ ...toTime, period: e.target.value })}>
                          <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Reason for Absence</label>
                <div className="relative">
                  <textarea
                    className="w-full p-6 pr-14 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all h-32 resize-none"
                    placeholder="Please state your reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button
                    onClick={handleCorrectReason}
                    disabled={isCorrecting || !reason.trim()}
                    className="absolute bottom-4 right-4 p-3 bg-white text-indigo-600 rounded-2xl shadow-lg border border-indigo-50 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 group"
                    title="AI Grammar Correction"
                  >
                    {isCorrecting ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover:animate-pulse" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={!reason || (leaveType !== 'Hourly' && (!fromDate || !toDate))}
                className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] rounded-[1.75rem] shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 mt-4"
              >
                <Send size={18} /> Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <History size={18} className="text-indigo-600" /> Application History
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {driverLeaves.length} Records
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Leave ID</th>
                <th className="px-8 py-5">From (Start)</th>
                <th className="px-8 py-5">To (End)</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {driverLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{leave.id}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${leave.type === 'Emergency' ? 'text-red-500' :
                        leave.type === 'Hourly' ? 'text-blue-500' : 'text-slate-400'
                        }`}>{leave.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{leave.fromDate}</span>
                      {leave.type === 'Hourly' && <span className="text-[9px] font-black text-indigo-500 mt-1">{leave.fromTime}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{leave.toDate}</span>
                      {leave.type === 'Hourly' && <span className="text-[9px] font-black text-indigo-500 mt-1">{leave.toTime}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${leave.status === 'Approved' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' :
                        leave.status === 'Rejected' ? 'bg-red-500 shadow-lg shadow-red-200' :
                          'bg-amber-500 shadow-lg shadow-amber-200'
                        }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${leave.status === 'Approved' ? 'text-emerald-600' :
                        leave.status === 'Rejected' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                        {leave.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 min-w-[200px]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                        {leave.adminRemarks || <span className="text-slate-200 font-medium not-italic">— Pending Review —</span>}
                      </p>
                      {(leave.status === 'Pending' || leave.status === 'Approved') && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this leave application?')) {
                              try {
                                await databaseService.cancelLeaveRequest(
                                  leave.id,
                                  state.user?.employeeId,
                                  leave.fromDate === todayStr ? todayStr : undefined
                                );
                                // Refresh state locally
                                updateState({
                                  leaves: state.leaves.map(l => l.id === leave.id ? { ...l, status: 'Cancelled by Driver' } : l)
                                });
                              } catch (e) {
                                alert('Failed to cancel leave. Please try again.');
                              }
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Cancel Application"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {driverLeaves.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Leave Records Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
