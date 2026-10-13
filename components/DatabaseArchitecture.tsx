import React from 'react';
import { Database, Zap, Shield, Image as ImageIcon, Server, Activity, ArrowRightLeft, Layers } from 'lucide-react';

interface DBInfo {
  name: string;
  type: string;
  role: string;
  dataModel: string;
  latency: string;
  icon: React.ElementType;
  color: string;
  attributes: string[];
}

const dbSpecs: DBInfo[] = [
  {
    name: 'Firebase RTDB',
    type: 'NoSQL / Real-time',
    role: 'Hot Storage: Live Ops',
    dataModel: 'JSON Tree',
    latency: '< 100ms',
    icon: Zap,
    color: 'text-amber-500',
    attributes: ['Live Bin Tracking', 'Instant Driver Status', 'Task Orchestration']
  },
  {
    name: 'Supabase (PG)',
    type: 'SQL / Relational',
    role: 'Structured Archive',
    dataModel: 'Tables & FKs',
    latency: '200ms - 500ms',
    icon: Database,
    color: 'text-emerald-500',
    attributes: ['Salary Calculations', 'Employee Relations', 'Reporting Engine']
  },
  {
    name: 'MongoDB',
    type: 'NoSQL / Document',
    role: 'Cold Storage: Logs',
    dataModel: 'BSON Documents',
    latency: 'Batch Optimized',
    icon: Server,
    color: 'text-green-600',
    attributes: ['Immutable Audit Logs', 'Deep History Archive', 'Event Snapshotting']
  },
  {
    name: 'Cloudinary',
    type: 'Object Storage / CDN',
    role: 'Media Vault',
    dataModel: 'Binary Blobs',
    latency: 'Edge Delivery',
    icon: ImageIcon,
    color: 'text-indigo-500',
    attributes: ['Bin Damage Photos', 'Driver ID Evidence', 'PDF Report Hosting']
  }
];

export const DatabaseArchitecture: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-12 space-y-12 bg-gray-50/50 rounded-[3rem]">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
          <Layers size={14} className="text-indigo-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">System Core</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
          QUAD-DATABASE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">ARCHITECTURE</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-3xl mx-auto text-lg leading-relaxed">
          Ujjwal Route orchestrates data across four specialized engines to ensure absolute data persistence 
          while maintaining sub-second real-time performance on the field.
        </p>
      </div>

      {/* Grid view for "Attributes" emphasis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dbSpecs.map((db, idx) => (
          <div key={db.name} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className={`w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${db.color}`}>
              <db.icon size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{db.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{db.role}</p>
            
            <div className="space-y-3 pt-6 border-t border-slate-50">
              {db.attributes.map(attr => (
                <div key={attr} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                  <span className="text-sm font-bold text-slate-600">{attr}</span>
                </div>
              ))}
            </div>
            
            {/* Index Ribbon */}
            <div className="absolute top-8 right-8 text-4xl font-black text-slate-50 select-none group-hover:text-slate-100 transition-colors">
              0{idx + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Comparison Table */}
      <div className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-800">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-400 animate-pulse" size={20} />
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Technical Multi-DB Matrix</h2>
          </div>
          <div className="hidden sm:block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Protocol: Ujjwal-Sync-V4
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Architecture</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Structure</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Latency</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {dbSpecs.map((db) => (
                <tr key={db.name} className="hover:bg-white/5 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <db.icon className={db.color} size={20} />
                      <span className="text-lg font-black text-white">{db.name.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-black rounded-lg border border-slate-700">
                      {db.type}
                    </span>
                  </td>
                  <td className="p-8 text-slate-400 font-bold text-sm">{db.dataModel}</td>
                  <td className="p-8">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-sm">{db.latency}</span>
                      <span className="text-[10px] text-slate-500 font-bold">End-to-End</span>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <Shield className="ml-auto text-emerald-500 opacity-50" size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logic Summary Footer */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center gap-12">
        <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
          <ArrowRightLeft className="text-white rotate-90" size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Atomic Sync Protocol</h4>
          <p className="text-slate-500 font-medium leading-relaxed">
            All write operations are managed by the <code className="bg-slate-50 px-2 py-0.5 rounded text-indigo-600 font-black">db.manager.ts</code> 
            gateway. This ensures that every event (like a bin collection) is simultaneously recorded in Firebase for the driver, 
            Supabase for the auditor, and MongoDB for the system logs, while media assets are offloaded to Cloudinary.
          </p>
        </div>
      </div>
    </div>
  );
};
