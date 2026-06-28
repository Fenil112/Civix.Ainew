import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { UserProfile } from '../../types';
import { toast } from 'react-hot-toast';
import { Check, ShieldCheck } from 'lucide-react';

export default function AdminAuthorities() {
  const { user } = useAuth();
  const [authorities, setAuthorities] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthorities = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'authority'));
      const snap = await getDocs(q);
      setAuthorities(
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
    fetchAuthorities();
  }, []);

  const handleApprove = async (u: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isVerified: true,
        updatedAt: serverTimestamp(),
      });
      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Approved Authority Officer',
        performedBy: user?.email || 'admin',
        targetId: u.uid,
        targetType: 'authority',
        details: { officerEmail: u.email, department: u.department || 'Unknown' },
        timestamp: serverTimestamp(),
      });
      toast.success('Authority approved successfully');
      fetchAuthorities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Manage Authorities</h1>
          <p className="text-slate-500 text-sm mt-1">Approve government authority accounts and audit their credentials</p>
        </div>

        {loading ? (
          <div className="space-y-3 skeleton h-48 rounded-2xl" />
        ) : authorities.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No authority profiles found.</p>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {authorities.map((u) => (
              <div key={u.uid} className="flex items-center justify-between p-4 hover:bg-white/1 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{u.displayName}</span>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {u.department || 'No Dept'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {u.isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApprove(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Officer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
