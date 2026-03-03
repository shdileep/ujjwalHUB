
import React from 'react';
import { Shield, Truck, ArrowRight, Lock } from 'lucide-react';
import { Role } from '../types';
import { DynamicLogo } from './DynamicLogo';
import { AdminLogo } from './AdminLogo';
import { DriverLogo } from './DriverLogo';

interface Props {
  onSelectRole: (role: Role) => void;
}

export const RoleSelection: React.FC<Props> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-between p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1.5px,transparent_1.5px)] [background-size:32px_32px]"></div>

      <div className="mt-12 text-center relative z-10">
        <div className="flex justify-center mb-6">
           <DynamicLogo size={120} animated={false} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">UjjwalHub</h1>
        <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Smart Tracking for Cleaner Cities</p>
      </div>

      <div className="w-full max-w-sm space-y-4 mb-16 relative z-10">
        <button
          onClick={() => onSelectRole('admin')}
          className="w-full group bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 shadow-xl shadow-slate-200/50 hover:shadow-indigo-100/50 transition-all duration-300 flex items-center gap-6 active:scale-[0.97]"
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white p-2">
            <AdminLogo size={48} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-black text-slate-800">Admin</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Control & Analytics</p>
          </div>
          <ArrowRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </button>

        <button
          onClick={() => onSelectRole('driver')}
          className="w-full group bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 shadow-xl shadow-slate-200/50 hover:shadow-emerald-100/50 transition-all duration-300 flex items-center gap-6 active:scale-[0.97]"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white p-2">
            <DriverLogo size={48} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-xl font-black text-slate-800">Driver</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Navigation</p>
          </div>
          <ArrowRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 opacity-60">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
          <Lock size={12} className="text-indigo-500" /> Secure Protocol
        </div>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">© 2026 UJJWALHUB</p>
      </div>
    </div>
  );
};
