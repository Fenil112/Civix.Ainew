import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { Camera } from 'lucide-react';

export default function Profile() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // States
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [ward, setWard] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [language, setLanguage] = useState('en');
  
  // Notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setCity(userProfile.city || '');
      setWard(userProfile.ward || '');
      setEmergencyContact(userProfile.emergencyContact || '');
      setLanguage(userProfile.language || 'en');
      setNotificationsEnabled(userProfile.notificationsEnabled ?? true);
      setEmailNotifications(userProfile.emailNotifications ?? true);
      setSmsNotifications(userProfile.smsNotifications ?? false);
    }
  }, [userProfile]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phone,
        address,
        city,
        ward,
        emergencyContact,
        language,
        notificationsEnabled,
        emailNotifications,
        smsNotifications,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setLoading(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={userProfile?.role || 'citizen'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Profile Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your identity, location settings, and notifications</p>
        </div>

        <form onSubmit={handleUpdate} className="grid md:grid-cols-3 gap-6">
          {/* Left Card - Avatar */}
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} className="w-full h-full rounded-2xl object-cover border border-white/10" alt="" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                  {userProfile?.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-1 right-1 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div>
              <h2 className="text-white font-semibold">{userProfile?.displayName}</h2>
              <p className="text-slate-500 text-xs mt-1 capitalize">{userProfile?.role}</p>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Member Since</span>
                <span className="text-slate-300">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Verified Citizen</span>
                <span className={userProfile?.isVerified ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {userProfile?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card - Form Details */}
          <div className="md:col-span-2 space-y-6">
            {/* General Info */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">General Information</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    placeholder="123 Street Name, Area"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Mumbai"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Ward / Local Area Code</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Ward 12A"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Emergency Contact Details</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Name, Contact Info"
                />
              </div>
            </div>

            {/* Notification settings */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Notification Preferences</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-slate-300 font-medium">Push Notifications</span>
                    <p className="text-xs text-slate-500">Receive alerts when status changes or nearby issues occur</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-surface-800 border-white/10"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-slate-300 font-medium">Email Alerts</span>
                    <p className="text-xs text-slate-500">Weekly updates and community leaderboard announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-surface-800 border-white/10"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-slate-300 font-medium">SMS Alerts</span>
                    <p className="text-xs text-slate-500">Critical announcements or emergency safety alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-surface-800 border-white/10"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-primary text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
