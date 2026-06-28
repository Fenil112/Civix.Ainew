import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import { FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AuthorityDashboard() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

  useEffect(() => {
    if (!userProfile?.department) return;
    
    const q = query(
      collection(db, 'complaints'),
      where('department', '==', userProfile.department),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        timeline: []
      })) as any as Complaint[];

      setComplaints(data);
      setStats({
        total: data.length,
        resolved: data.filter(c => c.status === 'resolved' || c.status === 'closed').length,
        pending: data.filter(c => c.status === 'submitted' || c.status === 'verified' || c.status === 'assigned' || c.status === 'in_progress').length,
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching authority complaints:', error);
      setLoading(false);
    });

    return unsub;
  }, [userProfile]);

  return (
    <DashboardLayout role="authority">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Welcome Officer, {userProfile?.displayName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Department: <span className="text-indigo-400 font-semibold">{userProfile?.department}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Assigned Complaints', value: stats.total, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            { label: 'Resolved Complaints', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-4xl font-bold font-display mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Complaints Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Department Issues</h2>
            <Link to="/authority/complaints" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All Complaints <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-slate-500">
              No issues currently assigned to your department.
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/authority/complaints/${c.id}`}
                  className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Reported by {c.citizenName} • {c.createdAt instanceof Date ? format(c.createdAt, 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 uppercase">
                    {c.severity}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
