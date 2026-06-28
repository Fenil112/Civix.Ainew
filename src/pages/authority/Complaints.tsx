import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint, ComplaintStatus } from '../../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, ChevronRight } from 'lucide-react';

const ALL_STATUSES: ComplaintStatus[] = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];

export default function AuthorityComplaints() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!userProfile?.department) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'complaints'),
          where('department', '==', userProfile.department),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          timeline: []
        })) as any as Complaint[];

        setComplaints(data);
      } catch (err) {
        console.error('Error fetching department complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [userProfile]);

  const filtered = complaints.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
    return matchSearch && matchStatus && matchSeverity;
  });

  return (
    <DashboardLayout role="authority">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Department Complaints</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and resolve issues for the {userProfile?.department} department</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or ID..."
              className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-dark rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="all">All Status</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input-dark rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">
            No complaints matching filter requirements.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/authority/complaints/${c.id}`}
                className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-display">#{c.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                      {c.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Reported by {c.citizenName} • {c.createdAt instanceof Date ? format(c.createdAt, 'MMM d, yyyy') : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${
                    c.severity === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                    c.severity === 'high' ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' :
                    c.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {c.severity}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                    {c.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
