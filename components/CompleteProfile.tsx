
import React, { useState } from 'react';
import { User } from '../types';
import { CHENNAI_LOCATIONS } from '../constants';
import { CHENNAI_AREAS } from '../constants/areas';
import { ArrowRight, ArrowLeft, MapPin, Phone, Hash, Shield, LogOut, Loader2 } from 'lucide-react';
import { DynamicLogo } from './DynamicLogo';
import { SearchableDropdown } from './SearchableDropdown';

interface Props {
  user: User;
  onComplete: (user: User) => void;
  onLogout: () => void;
}

export const CompleteProfile: React.FC<Props> = ({ user, onComplete, onLogout }) => {
  // UHDxxxxx for Drivers, UHAxxxxx for Admins
  const initialPrefix = user.role === 'admin' ? 'UHA' : 'UHD';
  const initialDigits = Math.floor(10000 + Math.random() * 90000);

  const [formData, setFormData] = useState({
    username: user.username,
    phone: '',
    location: 'Kandigai',
    employeeId: (user.employeeId && !user.employeeId.startsWith('EMP-')) ? user.employeeId : (initialPrefix + initialDigits)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.location) return;

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      onComplete({
        ...user,
        ...formData,
        isProfileComplete: true
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const themeColor = user.role === 'admin' ? 'indigo' : 'emerald';

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center p-6 bg-slate-50 transition-all duration-700`}>
      <div className="absolute top-0 left-0 w-full h-1/3 bg-slate-900 overflow-hidden">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1.5px,transparent_1.5px)] [background-size:24px_24px]`}></div>
      </div>

      <button onClick={onLogout} className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest z-50">
        <ArrowLeft size={16} /> Exit
      </button>

      <div className="w-full max-w-[450px] bg-white rounded-[3.5rem] p-10 shadow-2xl relative z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 scale-75">
            <DynamicLogo size={120} animated={false} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">Complete Your Profile</h1>
          <p className="text-sm font-bold text-slate-400 mt-2 text-center leading-relaxed">
            Almost there! We need a few more details to set up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Full Name</label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  required
                  type="tel"
                  placeholder="10-digit number"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 font-black text-slate-700 tracking-wider"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Work Location</label>
              <SearchableDropdown
                options={CHENNAI_AREAS}
                value={formData.location}
                onChange={(loc) => setFormData({ ...formData, location: loc })}
                placeholder="Select Chennai Area"
                ringColor="focus:ring-indigo-50"
              />
            </div>

            <div className="relative opacity-60">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">Employee ID (Assigned)</label>
              <div className="relative">
                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input readOnly type="text" value={formData.employeeId} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-black text-indigo-600" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!formData.phone || !formData.location || isSubmitting}
            className={`w-full py-5 bg-${themeColor}-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50`}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Finalizing...</> : <>Access Dashboard <ArrowRight size={20} /></>}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-[0.4em] transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </form>
      </div>

      <div className="mt-8 flex items-center gap-3 opacity-50">
        <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Authorized Session Active</p>
      </div>
    </div>
  );
};
