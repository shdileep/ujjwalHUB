
import React, { useState, useRef, useEffect } from 'react';
import { User as UserType } from '../../types';
import { MapPin, Mail, Phone, Hash, Shield, Save, Edit3, UserCircle, Camera, Trash2, ShieldCheck, Lock, Eye, EyeOff, Briefcase, ChevronDown, Search, Loader2, AlertTriangle, Heart } from 'lucide-react';
import { IdentityCard } from './IdentityCard';
import { CHENNAI_AREAS } from '../../constants/areas';
import { authService } from '../../services/auth.service';
import { databaseService } from '../../services/database.service';

interface Props {
  user: UserType;
  onUpdate: (user: UserType) => void;
}

/**
 * FIXED: Moved Field component outside Profile to prevent re-mounting and focus loss during typing.
 */
const Field = ({ label, value, icon: Icon, name, editable = false, type = "text", isEditing, formData, setFormData, showPassword, setShowPassword }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      <Icon size={12} /> {label}
    </label>
    {isEditing && editable ? (
      name === 'location' ? (
        <LocationField value={value} onChange={(val: string) => setFormData({ ...formData, location: val })} />
      ) : (
        <div className="relative">
          <input
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
            value={value}
            onChange={e => setFormData({ ...formData, [name]: e.target.value })}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      )
    ) : (
      <div className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-gray-700 font-bold truncate flex justify-between items-center shadow-sm min-h-[46px]">
        <span className={!editable && isEditing ? "opacity-50" : ""}>
          {type === "password" ? (showPassword ? value : "••••••••") : value}
        </span>
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    )}
  </div>
);

const LocationField = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(CHENNAI_AREAS);

  useEffect(() => {
    setFiltered(CHENNAI_AREAS.filter(a => a.toLowerCase().includes(search.toLowerCase())));
  }, [search]);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 outline-none font-bold transition-all cursor-pointer flex items-center justify-between"
      >
        <span>{value || 'Select Area...'}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-50">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Search size={14} className="text-gray-400" />
              <input
                autoFocus
                className="bg-transparent text-sm font-bold outline-none w-full"
                placeholder="Search area..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(area => (
              <div
                key={area}
                onClick={() => { onChange(area); setIsOpen(false); }}
                className="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm font-bold transition-colors"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Profile: React.FC<Props> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Cast user to any to allow password property access as it seems to be expected in this component
  const [formData, setFormData] = useState<any>({ ...user });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showChangeFields, setShowChangeFields] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (showChangeFields && (newPassword.trim() !== '' || confirmPassword.trim() !== '')) {
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      if (!passwordRegex.test(newPassword)) {
        alert("Password must be at least 8 characters long, include letters and numbers, and contain at least one special character.");
        return;
      }
      formData.password = newPassword;
    }

    onUpdate(formData);
    setIsEditing(false);
    setShowChangeFields(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // 1. Purge from Database
      await databaseService.purgeUserAllData(
        user.role,
        user.employeeId,
        user.uid,
        user.email
      );

      // 2. Delete Auth Account
      await authService.deleteAccount();

      // 3. Show Thank You Splash
      setShowConfirmDelete(false);
      setShowThankYou(true);

      // 4. Redirect after 2 seconds
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/'; // Redirect to Role Selection / Home
      }, 2000);

    } catch (err: any) {
      console.error("Deletion failed:", err);
      alert("Account deletion failed. You may need to log out and log back in to perform this action for security reasons.");
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, profilePhoto: base64String }));
        if (!isEditing) {
          onUpdate({ ...user, profilePhoto: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhoto: undefined }));
    if (!isEditing) {
      onUpdate({ ...user, profilePhoto: undefined });
    }
  };

  if (!user || !user.uid) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <UserCircle className="absolute inset-0 m-auto text-indigo-600/20" size={32} />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">
            Authenticating Session
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
            Retrieving Encrypted User Data...
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-24 px-2">
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Profile</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all border border-red-100"
            >
              <Trash2 size={16} /> Delete Account
            </button>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${isEditing
                ? 'bg-indigo-600 text-white shadow-indigo-100'
                : 'bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-indigo-200'
                }`}
            >
              {isEditing ? <><Save size={18} /> Save Changes</> : <><Edit3 size={18} /> Edit Details</>}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
            <UserCircle size={140} />
          </div>

          <div className="flex flex-col items-center mb-12 relative z-10">
            <div className="relative group/photo">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
                ) : (
                  <span className="text-4xl font-black text-slate-400">{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-all rounded-full cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <Camera className="text-white" size={28} />
              </div>

              {formData.profilePhoto && (
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                  className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg border-2 border-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <div className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-lg border border-slate-50">
                <ShieldCheck size={20} className="text-emerald-500" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>

            <h3 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">{user.username}</h3>
            <p className="text-[10px] text-indigo-600 uppercase tracking-[0.4em] font-black mt-2">Verified {user.role}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <Field
              label="Full Name"
              value={formData.username}
              icon={UserCircle}
              name="username"
              editable={true}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
            <Field
              label="Phone Number"
              value={formData.phone}
              icon={Phone}
              name="phone"
              editable={true}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
            <Field
              label="Email Address"
              value={formData.email}
              icon={Mail}
              name="email"
              editable={true}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
            {isAdmin && (
              <Field
                label="Designation"
                value="Central Operations Manager"
                icon={Briefcase}
                name="designation"
                editable={false}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            )}
            <Field
              label="Work Hub"
              value={formData.location}
              icon={MapPin}
              name="location"
              editable={true}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
            <Field
              label="Employee ID"
              value={formData.employeeId}
              icon={Hash}
              name="employeeId"
              editable={false}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
            />
            <Field
              label="Account Password"
              value={formData.password || ''}
              icon={Lock}
              name="password"
              editable={false}
              type="password"
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          </div>

          {isEditing && (
            <div className="mt-12 pt-8 border-t border-slate-50 space-y-6 relative z-10">
              {!showChangeFields ? (
                <button
                  onClick={() => setShowChangeFields(true)}
                  className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  <Lock size={14} /> Change Security Password
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={12} /> Change Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                        placeholder="Enter New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={12} /> Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={() => { setShowChangeFields(false); setNewPassword(''); setConfirmPassword(''); }}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest text-left hover:underline"
                    >
                      Cancel Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <IdentityCard user={user} />

      {/* Confirmation Dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Confirm Deletion</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              Are you sure you want to permanently delete your account and all associated data? This action <span className="text-red-500">cannot be undone</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
                Confirm Permanent Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Splash Overlay */}
      {showThankYou && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#0f172a] animate-in fade-in duration-500">
          <div className="text-center p-8 max-w-lg animate-in zoom-in-90 slide-in-from-bottom-10 duration-700 ease-out">
            <div className="w-24 h-24 bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20 rotate-12">
              <Heart size={48} className="fill-current" />
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
                <Shield size={12} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{user.role} Identity Purged</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Thank you for your {user.role === 'admin' ? 'work' : 'service'} and dedication towards UjjwalHUB, <br />
                <span className="text-indigo-400">{user.role === 'admin' ? 'Administrator' : 'Driver'} {user.username}</span>.
              </h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] pt-4">
                Session Terminated • Redirecting
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
