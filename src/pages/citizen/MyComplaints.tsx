import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint, ComplaintStatus } from '../../types';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ALL_STATUSES: ComplaintStatus[] = ['submitted','verified','assigned','in_progress','resolved','closed','rejected'];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-slate-400', bg: 'bg-slate-400/15' },
  verified: { label: 'Verified', color: 'text-sky-400', bg: 'bg-sky-400/15' },
  assigned: { label: 'Assigned', color: 'text-amber-400', bg: 'bg-amber-400/15' },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-400/15' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-400/15' },
  closed: { label: 'Closed', color: 'text-indigo-400', bg: 'bg-indigo-400/15' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/15' },
};

const severityDot: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
};

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'complaints'),
      where('citizenId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
        timeline: (d.data().timeline || []).map((t: any) => ({
          ...t,
          timestamp: t.timestamp?.toDate?.() || new Date(),
        })),
      })) as Complaint[];
      setComplaints(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = complaints.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white font-display">My Complaints</h1>
          <p className="text-slate-500 text-sm mt-1">{complaints.length} total complaints</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-dark rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="all">All Status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
        </div>

        {/* Status Summary */}
        <div className="flex gap-2 flex-wrap mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = complaints.filter((c) => c.status === status).length;
            if (!count) return null;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status ? `${config.bg} ${config.color} ring-1 ring-current` : 'glass text-slate-500 hover:text-slate-300'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass rounded-xl p-4 skeleton h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium mb-1">No complaints found</p>
            <p className="text-slate-600 text-sm">
              {search || filterStatus !== 'all' ? 'Try adjusting your filters' : 'You haven\'t reported any issues yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((complaint, i) => {
              const status = statusConfig[complaint.status] || statusConfig.submitted;
              const dot = severityDot[complaint.severity] || 'bg-slate-400';
              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/complaints/${complaint.id}`}
                    className="flex items-center gap-4 p-4 glass rounded-xl hover:border-indigo-500/20 border border-white/5 transition-all group"
                  >
                    {complaint.photos?.[0] ? (
                      <img src={complaint.photos[0]} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-surface-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-slate-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {complaint.title}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{complaint.category}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>{complaint.createdAt instanceof Date ? format(complaint.createdAt, 'MMM d, yyyy') : ''}</span>
                        <span>•</span>
                        <span>{complaint.supporterCount || 1} supporter{complaint.supporterCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
