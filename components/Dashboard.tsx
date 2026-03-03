
import React, { useState, useMemo, useEffect } from 'react';
import { Menu, X, LogOut, UserCircle, RefreshCw, Shield, Bell, Loader2, Trash2 } from 'lucide-react';
import { AppState, User } from '../types';
import { databaseService } from '../services/database.service';
import { ADMIN_NAV_ITEMS } from '../constants';
import { AREA_COMPONENT_MAPPING } from '../constants/areas';
import { LiveStatus } from './sections/LiveStatus';
import { Profile } from './sections/Profile';
import { BinsManagement } from './sections/BinsManagement';
import { DriversManagement } from './sections/DriversManagement';
import { AdminLeaves } from './sections/AdminLeaves';
import { Insights } from './sections/Insights';
import { Notifications } from './sections/Notifications';
import { Support } from './sections/Support';
import { AdminComplaints } from './sections/AdminComplaints';
import { Settings } from './sections/Settings';
import { AdminOverview } from './sections/AdminOverview';
import { DynamicLogo } from './DynamicLogo';
import { AdminLogo } from './AdminLogo';

interface Props {
  state: AppState;
  onLogout: () => void;
  updateState: (updates: Partial<AppState>) => void;
  onSync: () => void;
  binsLoading?: boolean;
  tasksLoading?: boolean;
  driversLoading?: boolean;
}

export const Dashboard: React.FC<Props> = ({ state, onLogout, updateState, onSync, binsLoading, tasksLoading, driversLoading }) => {
  const [forceEnter, setForceEnter] = useState(false);

  useEffect(() => {
    // Check drivers compliance on load if needed
  }, [state.user?.role]);

  // Safety Timeout: Force entry if loading takes > 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceEnter(true);
      console.warn("Dashboard: Synchronization timeout. Forcing entry.");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  const [activeTab, setActiveTab] = useState('live-status');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const unreadCount = useMemo(() => state.notifications.filter(n => !n.read).length, [state.notifications]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onSync();
    }, 1500);
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      await databaseService.repairDriverData();
      await databaseService.cleanupLegacyRootNodes();
      alert("✅ Database Repair Complete! All IDs at root (UHD...) have been moved into 'driver/' and 'admin/' subfolders. Refresh your Firebase Console to see 'driver', 'admin', and 'signup' nodes.");
    } catch (err) {
      console.error("Repair failed:", err);
      alert("❌ Repair failed. Check console for details.");
    } finally {
      setIsRepairing(false);
    }
  };

  const handleResetAreaBins = async () => {
    if (!state.user?.location) return;
    if (window.confirm(`Are you sure you want to reset all completed tasks in ${state.user.location}? This will make them pending tasks again while keeping the history.`)) {
      setIsSyncing(true);
      try {
        await databaseService.resetAreaBins(state.user.location);
        onSync(); // Refresh local state
        alert(`✅ Bins for ${state.user.location} have been reset!`);
      } catch (err) {
        console.error("Reset failed:", err);
        alert("❌ Reset failed. Check console.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Self-Healing: Check for drivers compliance and Hub Sync
  React.useEffect(() => {
    const healDrivers = async () => {
      try {
        const allUsers = await databaseService.getAllUsers();
        const allDrivers = await databaseService.getAllDrivers();

        const driverUsers = allUsers.filter(u => u.role === 'driver');
        const driverIds = new Set(allDrivers.map(d => d.driverId));
        // We use state.driversHub for the check as it's real-time synced
        const hubIds = new Set(state.driversHub.map(h => h.driverId));

        for (const user of driverUsers) {
          const isMissingDriver = !driverIds.has(user.employeeId);
          const isMissingHub = !hubIds.has(user.employeeId);

          if ((isMissingDriver || isMissingHub) && user.isProfileComplete) {
            console.log(`Healing driver record for: ${user.username} (Missing Driver: ${isMissingDriver}, Missing Hub: ${isMissingHub})`);

            // Re-creating driver will fix both 'drivers' and 'DriversHub' nodes
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            const driverData: any = {
              driverId: user.employeeId,
              username: user.username || 'Unknown',
              email: user.email || '',
              phone: user.phone || '',
              profilePhoto: user.profilePhoto || null,
              location: user.location || '', // Fixed: passing location for healing
              status: 'offline',
              createdAt: user.joinedAt || new Date().toISOString()
            };
            await databaseService.createDriver(user.employeeId, driverData);
            if (user.location) {
              await databaseService.redistributeAreaBins(user.location);
            }
          }
        }
      } catch (err) {
        console.error('Auto-healing failed:', err);
      }
    };

    if (state.driversHub.length > 0 || state.user) { // validation trigger
      healDrivers();
    }
  }, [state.drivers.length, state.driversHub.length, state.user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'live-status': return <LiveStatus drivers={state.liveStatus} adminUser={state.user!} />;
      case 'profile': return state.user ? <Profile user={state.user} onUpdate={(u) => updateState({ user: u })} /> : <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>;
      case 'bins':
        console.log("Dashboard: Rendering BinsManagement. Admin User:", state.user);
        return <BinsManagement bins={state.bins} drivers={state.drivers} onUpdate={(b) => updateState({ bins: b })} adminUser={state.user} />;
      case 'drivers': return <DriversManagement drivers={state.driversHub} updateState={updateState} adminUser={state.user} />;
      case 'leaves': return <AdminLeaves state={state} updateState={updateState} />;
      case 'complaints-mgmt': return <AdminComplaints complaints={state.complaints} drivers={state.drivers} onUpdate={(c) => updateState({ complaints: c })} adminUser={state.user!} />;
      case 'insights': return <Insights state={state} />;
      case 'notifications': return <Notifications notifications={state.notifications} onUpdate={(n) => updateState({ notifications: n })} />;
      case 'settings': return <Settings role="admin" />;
      case 'support': return <Support onNavigate={(tab) => setActiveTab(tab)} />;
      case 'overview-mgmt': return <AdminOverview state={state} />;
      default: return <LiveStatus drivers={state.liveStatus} adminUser={state.user!} />;
    }
  };

  const isSyncingData = binsLoading || driversLoading;



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-16 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <AdminLogo size={36} />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 border border-white">
                <Shield size={10} />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-gray-900 text-lg tracking-tight">UjjwalHub</span>
              <span className="block text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em] -mt-1">Admin Control</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={isSyncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isSyncing ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600'
              }`}>
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
              {!isSyncing && <span className="text-[8px] font-bold text-gray-400 mt-0.5">Last: {state.lastSynced}</span>}
            </div>
          </button>

          <button onClick={handleRepair} disabled={isRepairing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isRepairing ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-600'
              }`}>
            <Shield size={16} className={`${isRepairing ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-black uppercase tracking-widest">{isRepairing ? 'Repairing...' : 'Force DB Repair'}</span>
              <span className="text-[8px] font-bold text-gray-400 mt-0.5">Custom Nodes</span>
            </div>
          </button>

          {activeTab === 'bins' && (
            <button
              onClick={handleResetAreaBins}
              disabled={isSyncing}
              className={`p-2 transition-all rounded-xl ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95'}`}
              title="Reset Area Tasks"
            >
              <Trash2 size={24} />
            </button>
          )}

          <button onClick={() => setActiveTab('notifications')} className={`p-2 relative transition-colors ${activeTab === 'notifications' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="p-1 border-2 border-indigo-100 rounded-full hover:border-indigo-500 transition-colors">
              <UserCircle size={28} className="text-indigo-600" />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-800 truncate">{state.user?.username}</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase">Administrator</p>
                </div>
                <button onClick={() => { setActiveTab('profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><UserCircle size={16} /> Profile</button>
                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>

      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-[60] flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AdminLogo size={48} />
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white">
                    <Shield size={12} />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">UjjwalHub</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 font-black">Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {ADMIN_NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  {item.icon}<span className="font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-50">
              <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold uppercase text-[10px] tracking-widest"><LogOut size={18} /> Logout</button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
