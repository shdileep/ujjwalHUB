
import React, { useState } from 'react';
import { 
  Shield, Info, MapPin, User, Mail, Building, Phone, 
  ChevronRight, FileText, Lock, ShieldCheck, ExternalLink, 
  Download, HelpCircle, MessageSquare, AlertTriangle, X,
  ChevronDown, Scale, Clock, Globe, Briefcase, Video, 
  ArrowRight, Landmark, ScrollText, CheckCircle2, UserCircle2,
  Trash2, Users, FileBarChart, ShieldAlert, BookOpen, PlayCircle,
  Activity, Gavel, FileSearch, PieChart, Newspaper, Layers
} from 'lucide-react';

interface Props {
  role?: 'admin' | 'driver';
}

type SettingsView = 'menu' | 'support' | 'security' | 'terms' | 'projects' | 'tenders' | 'media';

export const Settings: React.FC<Props> = ({ role = 'driver' }) => {
  const [activeView, setActiveView] = useState<SettingsView>('menu');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const MenuItem = ({ icon: Icon, label, onClick, color = 'slate', badge }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-7 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group active:scale-95">
      <div className="flex items-center gap-5">
        <div className={`p-4 bg-${color}-50 text-${color}-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm`}>
          <Icon size={24} />
        </div>
        <div className="text-left">
          <span className="font-black text-slate-800 tracking-tight text-lg block leading-tight">{label}</span>
          {badge && <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">{badge}</span>}
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
    </button>
  );

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-8 px-2">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView('menu')} className="p-3 bg-white text-slate-400 hover:text-slate-800 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-90">
          <ArrowRight className="rotate-180" size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
    </div>
  );

  const officialProfiles = [
    { name: 'Dr. S. Kanth', role: 'Director', phone: '+91 44 2464 1234', email: 'director@ujjwalhub.tn.gov.in' },
    { name: 'Meena Iyer', role: 'Joint Commissioner', phone: '+91 44 2464 5678', email: 'jc@ujjwalhub.tn.gov.in' },
    { name: 'Er. Rajesh M.', role: 'Chief Engineer', phone: '+91 44 2464 9012', email: 'ce@ujjwalhub.tn.gov.in' },
    { name: 'Arun Kumar', role: 'Finance Officer', phone: '+91 44 2464 3456', email: 'fo@ujjwalhub.tn.gov.in' }
  ];

  const govPortals = [
    { name: 'TN Gov', icon: Globe },
    { name: 'Swachh Bharat', icon: Trash2 },
    { name: 'AMRUT', icon: Landmark },
    { name: 'Smart Cities', icon: Building },
    { name: 'MoHUA', icon: ShieldCheck },
    { name: 'NULM', icon: Users },
    { name: 'World Bank', icon: Landmark },
    { name: 'ADB', icon: Landmark },
    { name: 'KfW', icon: Landmark }
  ];

  if (activeView === 'support') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-10">
        <Header title="Support Information" />
        
        {/* Directorate Address Card */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
            <Landmark size={120} />
          </div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Official Headquarters</p>
          <h3 className="text-2xl font-black text-slate-900 mb-6 leading-tight">Ujjwal Hub Directorate</h3>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><MapPin size={24}/></div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">Santhome High Road,<br/>Chennai – 600028, Tamil Nadu</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Phone size={24}/></div>
              <div>
                <p className="text-sm font-black text-slate-700 leading-relaxed">+91 44 2464 1234 / 5678</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Available: 10AM - 6PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Officials Table/Grid */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Officials Directory</h4>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Official</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {officialProfiles.map((p, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800">{p.name}</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{p.role}</p>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                       <a href={`tel:${p.phone}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Phone size={14}/></a>
                       <a href={`mailto:${p.email}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Mail size={14}/></a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Government Portals - Extended Logo Carousel/Slider */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Government Portals</h4>
             <span className="text-[9px] font-black text-indigo-500 uppercase">Swipe &rarr;</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
            {govPortals.map((portal, i) => (
              <button key={i} className="min-w-[140px] bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-500 transition-all text-center group active:scale-95">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <portal.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block truncate">{portal.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'projects') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-10">
        <Header title="Projects & Schemes" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'UGSS Phase IV', status: '85%', agency: 'GCC', assistance: 'ADB', color: 'indigo' },
            { name: 'Septage Management', status: '62%', agency: 'TWAD', assistance: 'World Bank', color: 'emerald' },
            { name: 'Smart City Waste Grid', status: '94%', agency: 'CSCL', assistance: 'KfW', color: 'blue' },
            { name: 'AMRUT 2.0 Water Reuse', status: '12%', agency: 'CMA', assistance: 'Cent. Govt', color: 'purple' }
          ].map((proj, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group hover:border-indigo-200 transition-all">
               <div className={`absolute top-0 right-0 w-24 h-24 bg-${proj.color}-50 rounded-full -mr-8 -mt-8 opacity-50`}></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{proj.agency} | {proj.assistance}</p>
               <h4 className="text-xl font-black text-slate-900 mb-6 leading-tight">{proj.name}</h4>
               
               <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Implementation</span>
                     <span className={`text-[10px] font-black text-${proj.color}-600`}>{proj.status}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full bg-${proj.color}-600 rounded-full`} style={{ width: proj.status }}></div>
                  </div>
               </div>
               
               <button className="mt-8 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                  View Full Report <ArrowRight size={12} />
               </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'tenders') {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-10">
        <Header title="Tenders & Notices" />
        
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em]">Tender Ref / Title</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em]">Date</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { ref: 'GCC/SWM/2026/042', title: 'Smart Bin Procurement Tier 2', date: '22 Apr 2026', size: '2.4 MB' },
                { ref: 'CMA/UGD/R-12/A', title: 'Drainage Maintenance Zone 4', date: '18 Apr 2026', size: '1.8 MB' },
                { ref: 'AMRUT/STP/CH/01', title: 'Solar Powered STP Installation', date: '15 Apr 2026', size: '4.1 MB' }
              ].map((t, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-6">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t.ref}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{t.title}</p>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <p className="text-xs font-bold text-slate-400">{t.date}</p>
                  </td>
                  <td className="px-6 py-6">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                       <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeView === 'media') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-12">
        <Header title="Knowledge & Media" />
        
        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Video Gallery</h4>
           <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2, 3].map(v => (
                <div key={v} className="min-w-[280px] aspect-video bg-slate-900 rounded-[2.5rem] relative overflow-hidden group cursor-pointer shadow-xl">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                   </div>
                   <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Infrastructure Hub</p>
                      <p className="text-white font-black leading-tight">Project Spotlight: Zone {v} Waste Management Technology</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Administrative Blogs</h4>
           <div className="grid grid-cols-1 gap-4">
              {[
                { title: 'Chennai Smart City: The Road Ahead', desc: 'Financial planning for sustainable urban waste cycles.', icon: PieChart, date: 'Apr 24, 2026' },
                { title: 'UGD Maintenance Protocols', desc: 'New guidelines for zonal engineers and field supervisors.', icon: Newspaper, date: 'Apr 20, 2026' }
              ].map((blog, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-6 hover:shadow-lg transition-all cursor-pointer">
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <blog.icon size={24} />
                   </div>
                   <div>
                      <div className="flex justify-between items-start mb-1">
                         <h5 className="font-black text-slate-900 tracking-tight leading-tight">{blog.title}</h5>
                         <span className="text-[8px] font-black text-slate-300 uppercase shrink-0 ml-4">{blog.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{blog.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (activeView === 'security') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-10">
        <Header title="Security & Privacy" />
        
        <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12"><ShieldCheck size={120}/></div>
           <h3 className="text-2xl font-black mb-4">Enterprise Governance</h3>
           <p className="text-indigo-200 font-medium leading-relaxed mb-10 italic">
             "All administrative actions are logged and encrypted. Real-time auditing ensures complete transparency and accountability across the municipal grid."
           </p>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 text-center">
                 <p className="text-[9px] font-black text-indigo-300 uppercase mb-1">Protocol</p>
                 <p className="text-sm font-black">TLS 1.3 / SSL</p>
              </div>
              <div className="p-5 bg-white/10 rounded-2xl border border-white/10 text-center">
                 <p className="text-[9px] font-black text-indigo-300 uppercase mb-1">Standard</p>
                 <p className="text-sm font-black">CERT-In 2026</p>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           {[
             { title: 'Role-Based Access (RBAC)', content: 'Permissions are granularly managed to ensure sensitive citizen and field data is only accessible to authorized personnel.' },
             { title: 'Audit Trail Persistence', content: 'Every approval, rejection, or remark is timestamped and stored permanently for historical auditing.' }
           ].map((sec, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {sec.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{sec.content}</p>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (activeView === 'terms') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right duration-500 pb-20 px-2 space-y-10">
        <Header title="Terms & Conditions" />
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
           <div className="p-10 space-y-6">
              {[
                { title: 'Administrative Responsibility', content: 'Admins must verify field requests within 24 hours. Remarks are mandatory for all rejections to ensure due process.' },
                { title: 'Decision Finality', content: 'Once synchronized, leave approvals and resolved complaints are final within the dashboard. Re-appeals must go through official Directorate channels.' },
                { title: 'Data Retention', content: 'Logs are retained for 5 municipal years in accordance with TN Urban Body data policies.' }
              ].map((tc, i) => (
                <div key={i} className="space-y-2">
                   <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{i + 1}. {tc.title}</h5>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed">{tc.content}</p>
                </div>
              ))}
           </div>
           <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase">Policy Version</p>
                 <p className="text-xs font-black text-slate-800 tracking-tight">V3.1.2 - APR 2026</p>
              </div>
              <button className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all"><Download size={20}/></button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-500 pb-24">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Control Hub</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">UjjwalHub Admin v3.0</p>
      </div>

      <MenuItem icon={Info} label="Support Information" color="indigo" onClick={() => setActiveView('support')} />
      
      {role === 'admin' && (
        <>
          <MenuItem icon={Activity} label="Projects & Schemes" color="emerald" badge="4 ACTIVE" onClick={() => setActiveView('projects')} />
          <MenuItem icon={FileSearch} label="Tenders & Notices" color="blue" badge="NEW" onClick={() => setActiveView('tenders')} />
          <MenuItem icon={BookOpen} label="Knowledge & Media" color="purple" onClick={() => setActiveView('media')} />
        </>
      )}

      <MenuItem icon={Shield} label="Security & Privacy" color="indigo" onClick={() => setActiveView('security')} />
      <MenuItem icon={Scale} label="Terms & Conditions" color="slate" onClick={() => setActiveView('terms')} />
      
      <div className="mt-16 text-center space-y-6">
         <div className="w-20 h-20 bg-white border border-slate-100 shadow-xl rounded-[2rem] flex items-center justify-center mx-auto transition-transform hover:scale-110 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div className="relative z-10 w-12 h-12 bg-indigo-600 group-hover:bg-white rounded-xl flex items-center justify-center transition-colors">
              <span className="text-white group-hover:text-indigo-600 font-black text-2xl">U</span>
            </div>
         </div>
         <div>
           <p className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">UjjwalHub Directorate</p>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Chennai Metro Hub Release 3.1.0</p>
         </div>
         <div className="flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Real-time Node Active</span>
         </div>
      </div>
    </div>
  );
};

// Internal utility component - RefreshCw correctly uses ArrowRight from standard set
const RefreshCw = ({ size, className }: any) => <ArrowRight size={size} className={`${className} rotate-[-45deg]`} />;
