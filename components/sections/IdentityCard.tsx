
import React, { useMemo } from 'react';
import { User } from '../../types';
import { Download, ShieldCheck } from 'lucide-react';

interface Props {
  user: User;
}

export const IdentityCard: React.FC<Props> = ({ user }) => {
  const isDriver = user.role === 'driver';
  
  // Role-specific colors
  const roleBgColor = isDriver ? 'bg-emerald-600' : 'bg-indigo-600';

  // Randomized stable TN communication address
  const randomTnAddress = useMemo(() => {
    const addresses = [
      "No. 12, Anna Nagar West, Madurai – 625020, TN",
      "45/A, Gandhi Road, Salem – 636007, TN",
      "Apartment 3B, VGP Square, Coimbatore – 641018, TN",
      "Plot 88, K.K. Nagar, Tiruchirappalli – 620021, TN"
    ];
    const index = user.username.length % addresses.length;
    return addresses[index];
  }, [user.username]);

  const handleDownload = () => {
    window.print();
  };

  /**
   * Refined version of the 3D Logo for the compact card header.
   * Increased base scale for a more prominent presence.
   */
  const CardLogo = ({ scale = "scale-90" }: { scale?: string }) => (
    <div className={`flex flex-col items-center ${scale}`}>
      <div className="w-20 h-20 relative flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id="cardBevelForest" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="cardTopGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.45" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <clipPath id="cardHollowGap">
              <path d="M60,45 L80,78 L40,78 Z" />
            </clipPath>
          </defs>
          <g transform="translate(60, 60) scale(0.9) translate(-60, -60)">
            {[0, 120, 240].map((rot) => (
              <g key={`arrow-${rot}`} transform={`rotate(${rot}, 60, 65)`}>
                <path d="M60,12 L92,38 L80,38 L80,58 L40,58 L40,38 L28,38 Z" fill="black" opacity="0.1" transform="translate(1, 2)" />
                <path d="M60,12 L92,38 L80,38 L80,58 L40,58 L40,38 L28,38 Z" fill="url(#cardBevelForest)" />
                <path d="M60,12 L92,38 L80,38 L80,42 L40,42 L40,38 L28,38 Z" fill="url(#cardTopGloss)" />
              </g>
            ))}
            <g clipPath="url(#cardHollowGap)">
              <rect x="40" y="45" width="40" height="35" fill="white" />
              <rect x="48" y="52" width="6" height="26" fill="#64748b" />
              <rect x="55" y="48" width="7" height="30" fill="#475569" />
              <rect x="63" y="55" width="5" height="23" fill="#64748b" />
              <circle cx="45" cy="74" r="2.5" fill="#10b981" />
              <circle cx="70" cy="74" r="2.5" fill="#10b981" />
              <g transform="translate(52, 68) scale(0.12)">
                <rect x="0" y="0" width="42" height="22" rx="3" fill="#059669" />
                <rect x="42" y="8" width="16" height="14" rx="2" fill="#f8fafc" />
                <circle cx="10" cy="22" r="5" fill="#1e293b" />
                <circle cx="32" cy="22" r="5" fill="#1e293b" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Digital Identity Card</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
            Official Municipal Credentials
          </p>
        </div>
        <button 
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-200 active:scale-95 transition-all"
        >
          <Download size={18} /> 
          Export ID Card (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:hidden items-center justify-items-center px-4">
        
        {/* FRONT SIDE PREVIEW - REFINED POSITIONING */}
        <div className="flex flex-col items-center w-full">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Front Side</p>
          <div className="w-[280px] h-[480px] bg-white rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-50 overflow-hidden relative flex flex-col items-center transition-all duration-500 hover:shadow-indigo-100/50 hover:-translate-y-1">
            {/* Reduced Top Padding for Logo */}
            <div className="w-full pt-5 px-8 pb-8 flex flex-col items-center flex-1">
              
              {/* Top Logo - Increased gap below to shift photo down */}
              <div className="mb-9">
                <CardLogo scale="scale-90" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em] text-center -mt-2">UJJWAL HUB</p>
              </div>

              {/* Profile Photo - Shifted down approx one line height */}
              <div className="relative mb-5">
                <div className="w-32 h-32 rounded-full border-[5px] border-white shadow-2xl overflow-hidden bg-slate-50 flex items-center justify-center ring-1 ring-slate-100">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
                  ) : (
                    <div className="text-slate-200 font-black text-4xl">{user.username.charAt(0)}</div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg border border-slate-50">
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
              </div>

              {/* User Info - Consistent gaps maintained */}
              <div className="text-center space-y-0.5">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight truncate w-56">{user.username}</h4>
                <p className="text-xs font-mono font-black text-slate-400 tracking-tight">{user.employeeId}</p>
              </div>
            </div>

            {/* ROLE STRIP */}
            <div className={`w-full ${roleBgColor} py-6 flex flex-col items-center justify-center border-t border-white/10`}>
              <p className="text-white text-sm font-black uppercase tracking-[0.5em] text-center">
                {user.role}
              </p>
              <div className="mt-2 text-center">
                <p className="text-[7px] font-bold text-white/60 uppercase tracking-widest leading-none mb-0.5">Government of Tamil Nadu</p>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">WWW.UJJWALHUB.AC.IN</p>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE PREVIEW */}
        <div className="flex flex-col items-center w-full">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Back Side</p>
          <div className="w-[280px] h-[480px] bg-white rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] border border-slate-50 overflow-hidden relative flex flex-col p-8 transition-all duration-500 hover:shadow-indigo-100/50 hover:-translate-y-1">
            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                <p className="text-xs font-black text-slate-800">O+ (Positive)</p>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Office Address</p>
                <p className="text-[10px] font-bold text-slate-500 leading-tight">
                  Chennai Municipal Corporation<br/>
                  75, Urban Administrative Building,<br/>
                  Chennai – 600028, TN, India
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Comm. Address</p>
                <p className="text-[10px] font-bold text-slate-500 italic leading-tight uppercase">
                  {randomTnAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                  <p className="text-[10px] font-black text-slate-800">{user.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Validity</p>
                  <p className="text-[10px] font-black text-slate-900">JUL 2030</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div>
                  <p className="text-base font-bold text-slate-900 italic leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>Dileep SH</p>
                  <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Issued By (Authority)</p>
                </div>
                <div>
                  <p className="text-base font-bold text-indigo-400 leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>{user.username}</p>
                  <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Holder's Signature</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto text-center pt-4 border-t border-slate-50">
              <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">WWW.UJJWALHUB.AC.IN</p>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT VIEW - PAGE 1 & PAGE 2 */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
        {/* PAGE 1: FRONT */}
        <div className="h-[297mm] w-[210mm] flex items-center justify-center bg-white">
          <div className="w-[54mm] h-[85.6mm] bg-white border border-slate-300 rounded-[4mm] overflow-hidden flex flex-col items-center relative shadow-none">
            <div className="w-full pt-3 px-4 pb-4 flex flex-col items-center flex-1">
              <div className="mb-6 scale-50 -mt-2">
                <CardLogo scale="scale-90" />
              </div>
              <div className="w-16 h-16 rounded-full border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center mb-2">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-200 font-black text-sm">{user.username.charAt(0)}</div>
                )}
              </div>
              <h4 className="text-[8px] font-black text-slate-900 tracking-tight text-center uppercase leading-none mb-0.5">{user.username}</h4>
              <p className="text-[6px] font-mono font-black text-slate-400 tracking-tight text-center mb-2">{user.employeeId}</p>
            </div>
            
            <div className={`w-full mt-auto ${roleBgColor} py-2.5 flex flex-col items-center`}>
              <p className="text-white text-[7px] font-black uppercase tracking-widest text-center">
                {user.role}
              </p>
              <div className="mt-0.5 text-center w-full">
                <p className="text-[4px] font-bold text-white/50 uppercase tracking-widest">Government of Tamil Nadu</p>
                <p className="text-[5px] font-black text-white/30 uppercase tracking-[0.3em]">WWW.UJJWALHUB.AC.IN</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: BACK */}
        <div className="h-[297mm] w-[210mm] flex items-center justify-center bg-white break-before-page">
          <div className="w-[54mm] h-[85.6mm] bg-white border border-slate-300 rounded-[4mm] overflow-hidden p-5 flex flex-col relative shadow-none">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[4px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                <p className="text-[7px] font-black text-slate-800">O+ (Positive)</p>
              </div>
              <div>
                <p className="text-[4px] font-black text-slate-400 uppercase tracking-widest">Office Address</p>
                <p className="text-[5px] font-bold text-slate-500 leading-tight">
                  Chennai Municipal Corp, 75, Urban Admin Bldg, Chennai – 600028, TN, India
                </p>
              </div>
              <div>
                <p className="text-[4px] font-black text-slate-400 uppercase tracking-widest">Comm. Address</p>
                <p className="text-[5px] font-bold text-slate-500 italic leading-tight uppercase">
                  {randomTnAddress}
                </p>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-slate-50">
                <div>
                  <p className="text-[4px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                  <p className="text-[6px] font-black text-slate-800">{user.phone}</p>
                </div>
                <div>
                  <p className="text-[4px] font-black text-indigo-500 uppercase tracking-widest">Validity</p>
                  <p className="text-[6px] font-black text-slate-900">JUL 2030</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-50 space-y-2">
                <div>
                  <p className="text-[8px] font-bold text-slate-900 italic leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>Dileep SH</p>
                  <p className="text-[4px] font-black text-slate-300 uppercase mt-0.5">Issued By</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-indigo-400 leading-none" style={{ fontFamily: "'Dancing Script', cursive" }}>{user.username}</p>
                  <p className="text-[4px] font-black text-slate-300 uppercase mt-0.5">Holder's Sign</p>
                </div>
              </div>
            </div>
            <div className="mt-auto text-center pt-2 border-t border-slate-50">
              <p className="text-[6px] font-black text-slate-200 uppercase tracking-[0.3em]">WWW.UJJWALHUB.AC.IN</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
