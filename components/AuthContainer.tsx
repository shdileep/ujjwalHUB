import React, { useState, useRef, useEffect } from 'react';
import { User, Role } from '../types';
import { ArrowLeft, Mail, Lock, Phone, User as UserIcon, CheckCircle2, ArrowRight, Fingerprint, AlertCircle, Shield, Truck, Key, MessageSquareText, Eye, EyeOff, MapPin, ChevronDown, X, Check, Search, ChevronRight } from 'lucide-react';
import { DynamicLogo } from './DynamicLogo';
import { AdminLogo } from './AdminLogo';
import { DriverLogo } from './DriverLogo';
import { authService } from '../services/auth.service';
import { databaseService } from '../services/database.service';
import { CHENNAI_AREAS } from '../constants/areas';
import { SearchableDropdown } from './SearchableDropdown';

interface Props {
  role: Role;
  onLogin: (user: User, isNewSignup: boolean, password?: string) => void;
  onBack: () => void;
  registeredUsers: User[];
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const OtpInput: React.FC<{ onComplete: (otp: string) => void; themeColor: string }> = ({ onComplete, themeColor }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
    if (newOtp.every(v => v !== '')) onComplete(newOtp.join(''));
    else onComplete(''); // Clear completion state if any digit is missing
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <div className="flex gap-4 justify-center py-4">
      {otp.map((digit, i) => (
        <input
          key={i}
          // Fixed: Wrapped assignment in braces to ensure the ref callback returns void
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`w-12 h-16 border-2 rounded-2xl text-center text-2xl font-black transition-all focus:outline-none focus:border-${themeColor}-500 bg-white shadow-sm border-slate-100`}
        />
      ))}
    </div>
  );
};
const AreaRestrictionOverlay: React.FC<{
  role: Role;
  area: string;
  occupancy: { admins: number, drivers: number };
  adminName?: string;
  onClose: () => void;
}> = ({ role, area, occupancy, adminName, onClose }) => {
  const isFull = (role === 'admin' && occupancy.admins >= 1) || (role === 'driver' && occupancy.drivers >= 2);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-[450px] bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border-4 border-white/50">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-2 shadow-inner">
            <AlertCircle size={40} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Attention Required
            </h2>
            <div className="text-slate-500 font-bold px-4 leading-relaxed text-sm">
              {role === 'admin' ? (
                <div className="space-y-2">
                  <p className="text-amber-600 font-black uppercase text-xs tracking-widest">Active Control Detected</p>
                  <p>This area already under <span className="text-slate-900 font-black">[{adminName || 'Authorized Admin'}]</span> control.</p>
                  <p>Please select another area.</p>
                </div>
              ) : isFull ? (
                <div className="space-y-2">
                  <p className="text-rose-600 font-black uppercase text-xs tracking-widest">Sector Capacity Reached</p>
                  <p>We're sorry, this area is not available anymore. Please select any other area.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-amber-600 font-black uppercase text-xs tracking-widest">Limited Slots Remaining</p>
                  <p>This area is nearing capacity. Only one driver slot remains.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100 text-left">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact ujjwalHUB Administrator</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">G Dileep Sai</p>
                  <p className="text-[11px] font-bold text-indigo-600">supportujjwal@ac.in</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200/50 w-full"></div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Municipal Office</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                  <MapPin size={20} />
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">No. 123, Anna Salai, Chennai - 600002</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 text-xs"
          >
            Change Work Area
          </button>
        </div>
      </div>
    </div>
  );
};

export const AuthContainer: React.FC<Props> = ({ role, onLogin, onBack, registeredUsers }) => {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', location: 'Kandigai' });
  const [occupancyMap, setOccupancyMap] = useState<Record<string, { admins: number, drivers: number }>>({});
  const [showRestriction, setShowRestriction] = useState<string | null>(null);
  const [signupSplash, setSignupSplash] = useState<{ active: boolean, name: string }>({ active: false, name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (view === 'signup') {
      const fetchOccupancy = async () => {
        try {
          const [admins, drivers] = await Promise.all([
            databaseService.getAllAdmins(),
            databaseService.getAllDrivers()
          ]);

          const map: Record<string, { admins: number, drivers: number }> = {};
          admins.forEach(a => {
            if (a.location) {
              map[a.location] = { ...(map[a.location] || { admins: 0, drivers: 0 }), admins: (map[a.location]?.admins || 0) + 1 };
            }
          });
          drivers.forEach(d => {
            if (d.location) {
              map[d.location] = { ...(map[d.location] || { admins: 0, drivers: 0 }), drivers: (map[d.location]?.drivers || 0) + 1 };
            }
          });
          setOccupancyMap(map);
        } catch (e) {
          console.error("Error fetching occupancy:", e);
        }
      };
      fetchOccupancy();
    }
  }, [view]);

  // Derived restriction status
  const restrictedAreas = React.useMemo(() => {
    const restricted: Record<string, { label: string, isBlocked: boolean }> = {};
    Object.keys(occupancyMap).forEach(area => {
      const occ = occupancyMap[area] || { admins: 0, drivers: 0 };
      if (role === 'admin' && occ.admins >= 1) {
        restricted[area] = { label: 'UNDER CONTROL', isBlocked: true };
      } else if (role === 'driver') {
        if (occ.drivers >= 2) {
          restricted[area] = { label: 'AREA FULL', isBlocked: true };
        } else if (occ.drivers >= 1) {
          restricted[area] = { label: 'LIMITED SLOTS', isBlocked: false };
        }
      }
    });
    return restricted;
  }, [occupancyMap, role]);

  // Validation logic
  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);
  const hasSpecialChar = (pass: string) => /[^a-zA-Z0-9]/.test(pass);

  const config = {
    color: role === 'admin' ? 'indigo' : 'emerald',
    icon: role === 'admin' ? <AdminLogo size={40} /> : <DriverLogo size={48} />,
    title: role === 'admin' ? 'Admin' : 'Driver',
    bg: role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
    text: role === 'admin' ? 'text-indigo-600' : 'text-emerald-600',
    ring: role === 'admin' ? 'focus:ring-indigo-500/10' : 'focus:ring-emerald-500/10'
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Sign in with Firebase
      const firebaseAuthUser = await authService.signIn(formData.email, formData.password);
      const uid = firebaseAuthUser?.uid;

      // Get user data from database
      let userData = null;
      try {
        userData = await databaseService.getUserByEmail(formData.email);
      } catch (dbErr: any) {
        console.warn("Email lookup failed:", dbErr);
        if (dbErr.message?.includes('PERMISSION_DENIED')) {
          setError('Permission Denied: Your database rules are blocking this request. Please update your Firebase rules.');
          return;
        }
      }

      // Fallback to UID lookup if email failed or returned nothing
      if (!userData && uid) {
        try {
          userData = await databaseService.getUser(uid);
        } catch (dbErr: any) {
          console.error("UID lookup failed:", dbErr);
          if (dbErr.message?.includes('PERMISSION_DENIED')) {
            setError('Permission Denied reading user profile. Check Firebase Rules for /users node.');
            return;
          }
        }
      }

      if (!userData) {
        // If we have a firebase user but no DB record, handle as skeleton profile
        if (uid) {
          console.warn("User has Auth UID but no DB profile (or denied). Proceeding with skeleton.");
          const skeletonUser: User = {
            uid: uid,
            email: formData.email,
            username: formData.email.split('@')[0],
            role: role,
            employeeId: 'PENDING',
            phone: formData.phone || '',
            isProfileComplete: false
          };
          onLogin(skeletonUser, false);
          return;
        }
        setError('User not found in database');
        await authService.signOut();
        return;
      }

      // Verify role matches
      if (userData.role !== role) {
        setError('Invalid credentials or unauthorized role');
        await authService.signOut();
        return;
      }

      onLogin(userData, false);
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Invalid credentials');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidPhone(formData.phone)) {
      setError('Enter valid 10-digit phone number');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!hasSpecialChar(formData.password)) {
      setToast({ message: 'Please add a special character', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      localStorage.setItem('signup_in_progress', 'true');
      // Create Firebase auth user
      const firebaseUser = await authService.signUp(formData.email, formData.password);

      // Generate Role-Based ID: UHDxxxxx for Drivers, UHAxxxxx for Admins
      const prefix = role === 'admin' ? 'UHA' : 'UHD';
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const uniqueId = prefix + randomDigits;

      const newUser: User = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        employeeId: uniqueId,
        role,
        location: formData.location,
        isProfileComplete: true,
        uid: firebaseUser.uid
      };

      // Persist the user immediately to prevent App.tsx from creating a skeleton
      await databaseService.createUser(firebaseUser.uid, newUser);
      const sanitizedEmail = newUser.email.replace(/[.@]/g, '_');
      try {
        await databaseService.createUser(sanitizedEmail, newUser);
      } catch (e) {
        console.warn("Email-lookup record skip (rules):", e);
      }

      // Handle Role-Specific Nodes immediately
      if (role === 'driver') {
        const newDriver: any = {
          driverId: uniqueId,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          status: 'offline',
          location: formData.location,
          createdAt: new Date().toISOString()
        };
        await databaseService.createDriver(uniqueId, newDriver);
        await databaseService.saveToDriverNode(uniqueId, newDriver);
        await databaseService.createSignupRecord(uniqueId, {
          ...newDriver,
          location: formData.location
        });
      } else if (role === 'admin') {
        const newAdmin: any = {
          adminId: uniqueId,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          location: formData.location,
          role: 'admin',
          createdAt: new Date().toISOString(),
          isProfileComplete: true
        };
        await databaseService.createAdmin(uniqueId, newAdmin);
        await databaseService.saveToAdminNode(uniqueId, newAdmin);
        await databaseService.createSignupRecord(uniqueId, {
          ...newAdmin,
          location: formData.location
        });
      }

      // 2nd Driver Auto-Split Logic for Kandigai
      if (role === 'driver' && formData.location.toLowerCase() === 'kandigai') {
        const occ = occupancyMap['Kandigai'] || { admins: 0, drivers: 0 };
        if (occ.drivers === 1) {
          console.log("🚀 2nd Driver Detected. Triggering Splash & Split...");
          setSignupSplash({ active: true, name: formData.username });
          await databaseService.distributeKandigaiBinsSpatially();
          setTimeout(() => {
            setSignupSplash({ active: false, name: '' });
            onLogin(newUser, true, formData.password);
          }, 3000);
          return;
        }
      }

      onLogin(newUser, true, formData.password);
    } catch (error: any) {
      localStorage.removeItem('signup_in_progress');
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already registered');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        setError('Firebase Permission Denied: The system cannot save your data. Please check your Realtime Database Security Rules.');
      } else {
        setError(error.message || 'Sign up failed');
      }
    }
  };

  const handleGoogleSignIn = () => {
    // Simulate Google Sign-In
    const googleUser: User = {
      username: 'Google User',
      email: 'user@gmail.com',
      phone: '',
      employeeId: '',
      role: role,
      location: 'Chennai',
      isGoogleUser: true,
      isProfileComplete: false, // Must complete profile
      uid: 'google-' + Math.random().toString(36).substring(2, 10)
    };
    onLogin(googleUser, true);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      setError('Enter your email address');
      return;
    }

    try {
      await authService.resetPassword(formData.email);
      setToast({ message: 'Reset link sent to your email', type: 'success' });
      setTimeout(() => {
        setView('signin');
        setFormData({ ...formData, email: '' });
        setToast(null);
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send reset email');
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${role === 'admin' ? 'bg-[#0F172A]' : 'bg-[#ECFDF5]'}`}>

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-10">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
            <AlertCircle size={18} />
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <button onClick={onBack} className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest z-50">
        <ArrowLeft size={16} /> Exit
      </button>

      <div className="w-full max-w-[400px] bg-white rounded-[3rem] p-10 shadow-2xl relative">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            {role === 'admin' ? config.icon : <div className="text-emerald-600">{config.icon}</div>}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">
            {view === 'signin' && `Sign In as ${config.title}`}
            {view === 'signup' && `Create a New Account`}
            {view === 'forgot' && `Forgot Password`}
          </h1>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-4 mb-6 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm active:scale-95"
        >
          <GoogleLogo />
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-slate-100"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or use email</span>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        {view === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="Email ID / Phone Number"
                className={`w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                className={`w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="button" onClick={() => { setView('forgot'); setFormData({ ...formData, email: '', password: '' }); setError(''); }} className={`text-xs font-bold ${config.text} hover:underline`}>
              Forgot Password?
            </button>
            <button type="submit" className={`w-full py-5 ${config.bg} text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-95 mt-4`}>
              Sign In
            </button>
            <p className="text-center text-xs font-bold text-slate-400 mt-6">
              Don’t have an account? <button type="button" onClick={() => { setView('signup'); setError(''); setFormData({ ...formData, phone: '', password: '', username: '', email: '', location: '' }); }} className={`${config.text} hover:underline font-black`}>Create New Account</button>
            </p>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="Full Name"
                className={`w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="email" placeholder="Email ID"
                className={`w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="tel" placeholder="Phone Number"
                className={`w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-black text-slate-700 tracking-wider`}
                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </div>

            <div className="relative mt-2">
              <SearchableDropdown
                options={CHENNAI_AREAS}
                value={formData.location}
                onChange={(val) => {
                  const restriction = restrictedAreas[val];
                  if (restriction && restriction.isBlocked) {
                    setShowRestriction(val);
                  } else {
                    setFormData({ ...formData, location: val });
                  }
                }}
                placeholder="Select Work Area"
                ringColor={config.ring}
                restrictedKeys={restrictedAreas}
              />
            </div>

            <div className="relative mt-4">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                className={`w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit"
              disabled={!formData.username || !formData.email || !formData.phone || !formData.location || formData.password.length < 8}
              className={`w-full py-5 ${config.bg} text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-95 mt-4 disabled:opacity-50`}
            >
              Sign Up
            </button>

            <p className="text-center text-xs font-bold text-slate-400 mt-6">
              Already have an account? <button type="button" onClick={() => setView('signin')} className={`${config.text} hover:underline font-black`}>Sign In</button>
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-6">
            <div className="relative">
              <MessageSquareText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" placeholder="Gmail Address / 10-digit Phone"
                className={`w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${config.ring} font-bold text-slate-700`}
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <button type="submit"
              className={`w-full py-5 ${config.bg} text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-50`}>
              Send Reset Link
            </button>
            <div className="pt-4 text-center">
              <button type="button" onClick={() => setView('signin')} className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.4em] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] text-center animate-pulse pt-4">{error}</p>}
      </div>
      {showRestriction && (
        <AreaRestrictionOverlay
          role={role}
          area={showRestriction}
          occupancy={occupancyMap[showRestriction] || { admins: 0, drivers: 0 }}
          adminName={registeredUsers.find(u => u.role === 'admin' && u.location === showRestriction)?.username}
          onClose={() => setShowRestriction(null)}
        />
      )}

      {signupSplash.active && (
        <div className="fixed inset-0 z-[1000] bg-indigo-600 flex flex-col items-center justify-center p-6 animate-in zoom-in-110 duration-500">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-white mb-8 animate-bounce">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-widest uppercase text-center">
            Signed Up!
          </h2>
          <p className="text-indigo-100 font-bold mt-4 text-xl">{signupSplash.name}</p>
          <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mt-12 animate-pulse">Initializing Sector Split...</p>
        </div>
      )}
    </div>
  );
};