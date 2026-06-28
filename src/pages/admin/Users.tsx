import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { UserProfile } from '../../types';
import { toast } from 'react-hot-toast';
import { Search, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'citizen'));
      const snap = await getDocs(q);
      setUsers(
        snap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as UserProfile[]
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (u: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isBanned: !u.isBanned,
        updatedAt: serverTimestamp(),
      });
      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        action: u.isBanned ? 'Unbanned User' : 'Banned User',
        performedBy: user?.email || 'admin',
        targetId: u.uid,
        targetType: 'user',
        details: { userEmail: u.email },
        timestamp: serverTimestamp(),
      });
      toast.success(u.isBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleVerification = async (u: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isVerified: !u.isVerified,
        updatedAt: serverTimestamp(),
      });
      toast.success(u.isVerified ? 'Verification revoked' : 'User verified');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Manage Citizens</h1>
          <p className="text-slate-500 text-sm mt-1">Audit profiles, verify citizen credentials, and suspend abusers</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-3 skeleton h-48 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No citizen accounts found.</p>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {filtered.map((u) => (
              <div key={u.uid} className="flex items-center justify-between p-4 hover:bg-white/1 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{u.displayName}</span>
                    {u.isVerified && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                    {u.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">Banned</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVerification(u)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      u.isVerified
                        ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {u.isVerified ? 'Revoke Verification' : 'Verify'}
                  </button>

                  <button
                    onClick={() => handleToggleBan(u)}
                    className={`p-2 rounded-xl border transition-all ${
                      u.isBanned
                        ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                        : 'border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/20'
                    }`}
                    title={u.isBanned ? 'Unban User' : 'Ban User'}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
