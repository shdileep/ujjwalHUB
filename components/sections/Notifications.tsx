import React, { useState, useMemo } from 'react';
import { Notification } from '../../types';
import { databaseService } from '../../services/database.service';
import {
  Bell, Plus, Trash2, Edit3, Clock, Send,
  ShieldCheck, Check, MessageSquare, Activity,
  CheckCircle2, Circle, ArrowUpRight, ArrowDownLeft,
  ChevronRight, Inbox, Mail
} from 'lucide-react';

interface Props {
  notifications: Notification[];
  onUpdate: (notifications: Notification[]) => void;
  readonly?: boolean;
}

export const Notifications: React.FC<Props> = ({ notifications, onUpdate, readonly }) => {
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'to' | 'from'>('to');

  // Separate notifications by type
  const broadcasts = useMemo(() => notifications.filter(n => n.type === 'broadcast'), [notifications]);
  const activities = useMemo(() => notifications.filter(n => n.type === 'activity'), [notifications]);

  const handlePost = () => {
    if (!newMessage.trim()) return;

    if (editingId) {
      const updates = { message: newMessage, timestamp: new Date().toLocaleString() };
      onUpdate(notifications.map(n => n.id === editingId ? { ...n, ...updates } : n));
      databaseService.updateNotification(editingId, updates);
      setEditingId(null);
    } else {
      const newNotif: Notification = {
        id: Date.now().toString(),
        message: newMessage,
        timestamp: new Date().toLocaleString(),
        type: 'broadcast',
        read: false
      };
      // Optimistic update
      onUpdate([newNotif, ...notifications]);
      // Persist
      databaseService.createNotification(newNotif);
    }
    setNewMessage('');
  };

  const deleteNotif = (id: string) => {
    onUpdate(notifications.filter(n => n.id !== id));
    databaseService.deleteNotification(id);
  };

  const markAllAsRead = () => {
    onUpdate(notifications.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      if (!n.read) databaseService.updateNotification(n.id, { read: true });
    });
  };

  const toggleRead = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    const newReadStatus = !notif.read;
    onUpdate(notifications.map(n => n.id === id ? { ...n, read: newReadStatus } : n));
    databaseService.updateNotification(id, { read: newReadStatus });
  };

  // Fixed: Explicitly typed as React.FC to avoid 'key' prop errors when used in .map()
  const NotificationItem: React.FC<{ notif: Notification }> = ({ notif }) => (
    <div
      className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-start gap-4 group transition-all hover:shadow-md relative overflow-hidden ${!notif.read ? 'border-indigo-100 ring-1 ring-indigo-50' : 'border-gray-100'
        }`}
    >
      <div className={`p-3 rounded-2xl flex-shrink-0 ${notif.type === 'broadcast' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
        }`}>
        {notif.type === 'broadcast' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
            <span className={notif.type === 'broadcast' ? 'text-emerald-600' : 'text-indigo-600'}>
              {notif.type === 'broadcast' ? 'Dispatched Instruction' : 'Driver Activity Report'}
            </span>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <Clock size={10} /> {notif.timestamp}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => toggleRead(notif.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-all">
              {notif.read ? <Circle size={14} /> : <CheckCircle2 size={14} />}
            </button>
            {!readonly && notif.type === 'broadcast' && (
              <button onClick={() => { setEditingId(notif.id); setNewMessage(notif.message); setActivePanel('to'); }} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg transition-all">
                <Edit3 size={14} />
              </button>
            )}
            <button onClick={() => deleteNotif(notif.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="text-gray-700 font-semibold leading-relaxed break-words">{notif.message}</p>
        {!notif.read && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">New Update</span>
          </div>
        )}
      </div>
    </div>
  );

  if (readonly) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Official Notifications</h2>
          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {broadcasts.length} Messages
          </span>
        </div>
        <div className="space-y-4">
          {broadcasts.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
          {broadcasts.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-100 opacity-60">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No active dispatches</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to PERMANENTLY DELETE all notifications? This cannot be undone.')) {
      // Optimistic update
      const allIds = notifications.map(n => n.id);
      onUpdate([]);

      // Bulk delete or loop
      for (const id of allIds) {
        await databaseService.deleteNotification(id);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Dynamic Header with To/From Controls */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-2">
        <button
          onClick={() => setActivePanel('to')}
          className={`flex-1 py-4 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${activePanel === 'to' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
            }`}
        >
          <Send size={18} className={activePanel === 'to' ? 'text-emerald-400' : ''} />
          <div className="text-left leading-none">
            <p className="text-[10px] font-black uppercase tracking-widest">To Drivers</p>
            <p className="text-[8px] font-bold opacity-60 uppercase mt-0.5">Outbox Dispatch</p>
          </div>
        </button>
        <button
          onClick={() => setActivePanel('from')}
          className={`flex-1 py-4 rounded-[2rem] flex items-center justify-center gap-3 transition-all relative ${activePanel === 'from' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
            }`}
        >
          <Bell size={18} className={activePanel === 'from' ? 'text-indigo-400' : ''} />
          <div className="text-left leading-none">
            <p className="text-[10px] font-black uppercase tracking-widest">From Drivers</p>
            <p className="text-[8px] font-bold opacity-60 uppercase mt-0.5">Incoming Alerts</p>
          </div>
          {activities.filter(a => !a.read).length > 0 && (
            <div className="absolute top-2 right-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
              {activities.filter(a => !a.read).length}
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {activePanel === 'to' ? 'Dispatches' : 'System Logs'}
          </h2>
          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-1">
            {activePanel === 'to' ? 'Admin instruction node' : 'Real-time grid activity'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-500 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <CheckCircle2 size={14} /> Mark Read
          </button>
        </div>
      </div>

      {activePanel === 'to' && (
        <div className="space-y-8 animate-in slide-in-from-left-4">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm transition-all focus-within:shadow-md focus-within:border-emerald-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Mail size={14} className="text-emerald-500" /> Dispatch New Field Notice
            </h3>
            <div className="relative">
              <textarea
                className="w-full p-6 bg-slate-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none resize-none h-36 transition-all font-bold text-slate-700"
                placeholder="Type assignment details, route warnings, or city-wide alerts for drivers..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                onClick={handlePost}
                disabled={!newMessage.trim()}
                className="absolute bottom-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50 transform active:scale-95 group"
              >
                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Inbox size={14} className="text-slate-300" />
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Previous Dispatches</h4>
            </div>
            {broadcasts.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
            {broadcasts.length === 0 && (
              <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No sent messages</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activePanel === 'from' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex items-center gap-2 px-2">
            <Activity size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Live System Pulse</h4>
          </div>
          <div className="space-y-4">
            {activities.map(notif => <NotificationItem key={notif.id} notif={notif} />)}
            {activities.length === 0 && (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-100 flex flex-col items-center justify-center opacity-60">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-slate-200" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Grid Activity Nominal - No Alerts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};