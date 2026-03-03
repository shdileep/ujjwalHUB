
import React, { useMemo } from 'react';
import { AppState } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Trash2, CheckCircle, AlertCircle, BarChart3, Database } from 'lucide-react';
import { AREA_COMPONENT_MAPPING } from '../../constants/areas';
import { KANDIGAI_BINS } from '../../constants/kandigaiData';
import { getSpecialAreaBins } from '../../utils/binRandomizer';

export const Insights: React.FC<{ state: AppState }> = ({ state }) => {
  // ── Filter bins by admin location (EXACT SAME logic as BinsManagement/TaskPro) ──
  const visibleBins = useMemo(() => {
    const bins = state.bins || [];
    const adminLoc = (state.user?.location || '').trim();
    const adminLocLower = adminLoc.toLowerCase();

    if (!adminLoc || adminLocLower === 'total' || adminLocLower === 'chennai' || adminLocLower === 'all') return bins;

    let allowedComponents = AREA_COMPONENT_MAPPING[adminLoc];
    if (!allowedComponents) {
      const matchingKey = Object.keys(AREA_COMPONENT_MAPPING).find(k => k.toLowerCase() === adminLocLower);
      if (matchingKey) allowedComponents = AREA_COMPONENT_MAPPING[matchingKey];
    }
    allowedComponents = allowedComponents || [];

    const filtered = bins.filter(b => {
      const binArea = (b.areaName || '').trim().toLowerCase();
      const binLoc = (b.locationName || '').trim().toLowerCase();

      if (binArea === adminLocLower || binLoc === adminLocLower) return true;

      if (adminLocLower === 'west chengalpattu') {
        if (binArea === 'west chengalpattu' || binArea === 'kandigai') return true;
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur'];
        return WCP_SUB_AREAS.some(sa => binLoc.includes(sa) || binArea.includes(sa));
      }

      if (adminLocLower === 'kandigai') {
        return binArea === 'kandigai' || binLoc === 'kandigai' || binLoc === 'melakottaiyur' || binLoc === 'nallambakkam';
      }

      if (allowedComponents.length > 0) {
        return allowedComponents.some(c => {
          const compLower = c.toLowerCase();
          return binArea === compLower || binLoc === compLower || binLoc.includes(compLower);
        });
      }

      return false;
    });

    if (filtered.length > 0) {
      if (adminLocLower === 'adambakkam' || adminLocLower === 'west chengalpattu' || adminLocLower === 'kandigai') {
        return filtered;
      }
      return getSpecialAreaBins(filtered, adminLoc);
    }

    return filtered;
  }, [state.bins, state.user?.location]);

  // ── Filter drivers by admin location ──
  const filteredDrivers = useMemo(() => {
    const drivers = state.drivers || [];
    const adminLoc = (state.user?.location || '').trim();
    const adminLocLower = adminLoc.toLowerCase();

    if (!adminLoc || adminLocLower === 'total' || adminLocLower === 'chennai' || adminLocLower === 'all') return drivers;

    return drivers.filter(d => {
      const dLoc = (d.location || '').toLowerCase();
      if (dLoc === adminLocLower) return true;
      if (adminLocLower === 'west chengalpattu') {
        const WCP_SUB_AREAS = ['kandigai', 'nallambakkam', 'kolapakkam', 'unamancheri', 'melakottaiyur'];
        return WCP_SUB_AREAS.some(sa => dLoc.includes(sa));
      }
      if (adminLocLower === 'kandigai') {
        return dLoc === 'kandigai' || dLoc === 'melakottaiyur' || dLoc === 'nallambakkam';
      }
      return false;
    });
  }, [state.drivers, state.user?.location]);

  const activeCount = filteredDrivers.filter(d => d.availability === 'On Duty' || d.status === 'online').length;
  const inactiveCount = filteredDrivers.length - activeCount;

  const driverData = [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Inactive', value: inactiveCount, color: '#ef4444' },
  ];

  // Live bin status from filtered bins (synced with TaskPro)
  const binStatusData = [
    { name: 'Full', count: visibleBins.filter(b => b.status === 'Full').length, color: '#ef4444' },
    { name: 'Half Full', count: visibleBins.filter(b => b.status === 'Half Full' || b.status === 'Half-Full').length, color: '#f59e0b' },
    { name: 'Empty', count: visibleBins.filter(b => b.status === 'Empty').length, color: '#10b981' },
    { name: 'Completed', count: visibleBins.filter(b => b.status === 'Completed').length, color: '#3b82f6' },
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Operational Insights</h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div> Real-time Node Analytics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Database size={14} className="text-slate-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grid ID: HUB-3001</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Personnel" value={filteredDrivers.length} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Active Units" value={activeCount} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
        <StatCard title="Security Alerts" value={inactiveCount} icon={AlertCircle} colorClass="bg-red-50 text-red-600" />
        <StatCard title="Grid Hubs" value={visibleBins.length} icon={Trash2} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Driver Activity Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Personnel Verification</h3>
            <Users size={18} className="text-slate-300" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={driverData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {driverData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {driverData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bin Status Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Bin Fill Levels (Live)</h3>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={binStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={45}>
                  {binStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex justify-center flex-wrap gap-4">
            {binStatusData.map(d => (
              <div key={d.name} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{d.name}: {d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
          <Database size={100} />
        </div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Grid Integrity Report</h4>
          <p className="text-xl font-bold leading-relaxed opacity-90 mb-8 max-w-lg">
            System synchronized with {visibleBins.length} active nodes across {filteredDrivers.length} operational fleet vectors.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Efficiency Index</span>
              <span className="text-2xl font-black">{visibleBins.length > 0 ? ((visibleBins.filter(b => b.status === 'Completed').length / visibleBins.length) * 100).toFixed(1) : '0.0'}%</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Sync Heartbeat</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="text-xs font-black uppercase text-emerald-400 tracking-widest">Stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
