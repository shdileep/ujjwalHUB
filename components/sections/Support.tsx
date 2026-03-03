
import React from 'react';
import { Leaf, ShieldCheck, Truck, Globe, Info, Target, Activity, Radio, Trash2, Users, BarChart, HelpCircle, ArrowRight, Shield } from 'lucide-react';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const Support: React.FC<Props> = ({ onNavigate }) => {
  const redirectLinks = [
    { title: 'Mission & Vision', icon: Target, path: '/about/mission', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Operations Overview', icon: Activity, path: '/about/operations', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Live Monitoring', icon: Radio, path: 'live-status', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Bins Management', icon: Trash2, path: 'bins', color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Drivers Management', icon: Users, path: 'drivers', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Reports & Analytics', icon: BarChart, path: 'insights', color: 'text-pink-600', bg: 'bg-pink-50' },
    { title: 'Sustainability Initiatives', icon: Leaf, path: '/about/sustainability', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Help & Guidelines', icon: HelpCircle, path: 'support', color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  const handleBoxClick = (path: string) => {
    if (['live-status', 'bins', 'drivers', 'insights', 'support'].includes(path)) {
      onNavigate?.(path);
    } else {
      console.log(`Navigating to: ${path}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-10 px-4">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 mb-4 animate-in zoom-in-50 duration-700">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
            <span className="text-indigo-600 font-black text-3xl">U</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">UjjwalHub Ecosystem</h2>
          <p className="text-slate-500 leading-relaxed text-lg max-w-xl mx-auto">
            A centralized node for urban intelligence and waste logistics optimization.
          </p>
        </div>
      </div>

      {/* Redirect Navigation Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">System Directory</h3>
          <div className="h-px flex-1 bg-slate-100 mx-6"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {redirectLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => handleBoxClick(link.path)}
              className="group relative flex flex-col items-start p-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2 text-left active:scale-95"
            >
              <div className={`w-14 h-14 ${link.bg} ${link.color} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm`}>
                <link.icon size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-800 tracking-tight leading-tight">{link.title}</h4>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Explore</span>
                  <ArrowRight size={10} className="text-indigo-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Collaborations & Recognitions Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Collaborations & Recognitions</h3>
          <div className="h-px flex-1 bg-slate-100 mx-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-lg hover:border-indigo-100 transition-all group">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
               <div className="text-[10px] font-black text-slate-900 leading-tight text-center">GCC<br/><span className="text-[6px] text-indigo-600">PARTNER</span></div>
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Greater Chennai Corporation</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Strategic partner for urban waste management protocols and civic logistics integration across Chennai Metro.
            </p>
          </div>

          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-lg hover:border-indigo-100 transition-all group">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
               <Globe size={32} className="text-blue-600" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Smart Cities Mission</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Aligned with MoHUA (Govt. of India) initiatives for sustainable urban technology and smart grid sanitation.
            </p>
          </div>

          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-lg hover:border-indigo-100 transition-all group">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
               <Shield size={32} className="text-red-600" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">CERT-In Protocol</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Committed to Indian cybersecurity standards for platform infrastructure and sensitive citizen data protection.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Value Prop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 text-center group">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Leaf size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-3 tracking-tight">Eco-Optimization</h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">Dynamic route algorithms reducing fleet carbon footprints by up to 35% through precision logistics.</p>
        </div>

        <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 text-center group">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Globe size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-3 tracking-tight">Unified Grid</h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">Connecting Chennai's disparate waste collection nodes into a single, high-fidelity real-time dashboard.</p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-slate-900 text-white rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12">
          <Truck size={140} />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-block px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 border border-emerald-500/20">
            Strategic Roadmap
          </div>
          <h3 className="text-3xl font-black mb-6 tracking-tight">The Clean City Protocol</h3>
          <p className="text-slate-300 leading-relaxed text-lg font-medium italic">
            "We aren't just tracking trucks; we're architecting a cleaner urban future where logistics serves humanity and the environment in perfect harmony."
          </p>
          <div className="mt-10 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-2xl border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-lg">
                  <img src={`https://picsum.photos/100/100?random=${i + 10}`} alt="stakeholder" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">Govt. Certified Solution</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active City-Wide Grid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Support CTA */}
      <div className="text-center pt-4 pb-10">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.6em] mb-6">Need Administrative Assistance?</p>
        <button 
          onClick={() => onNavigate?.('support')}
          className="group relative px-10 py-5 bg-white border border-slate-200 rounded-[2rem] text-slate-900 font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:shadow-2xl hover:border-indigo-500 transition-all flex items-center gap-4 mx-auto active:scale-95"
        >
          Contact Tech Support <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
