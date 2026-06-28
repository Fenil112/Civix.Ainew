import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import {
  Plus, TrendingUp, CheckCircle, Clock, AlertTriangle,
  FileText, MapPin, Trophy, Zap, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-slate-400', bg: 'bg-slate-400/15' },
  verified: { label: 'Verified', color: 'text-sky-400', bg: 'bg-sky-400/15' },
  assigned: { label: 'Assigned', color: 'text-amber-400', bg: 'bg-amber-400/15' },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-400/15' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-400/15' },
  closed: { label: 'Closed', color: 'text-indigo-400', bg: 'bg-indigo-400/15' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/15' },
};

const severityConfig: Record<string, { color: string; dot: string }> = {
  low: { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { color: 'text-amber-400', dot: 'bg-amber-400' },
  high: { color: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { color: 'text-red-400', dot: 'bg-red-400' },
};

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: string | number; icon: any; color: string; bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold font-display ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </motion.div>
  );
}

export default function CitizenDashboard() {
  const { user, userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, inProgress: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'complaints'),
      where('citizenId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
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
      setStats({
        total: data.length,
        resolved: data.filter((c) => c.status === 'resolved' || c.status === 'closed').length,
        inProgress: data.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length,
        pending: data.filter((c) => c.status === 'submitted' || c.status === 'verified').length,
      });
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Pending Review', value: stats.pending, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              {greeting}, {userProfile?.displayName?.split(' ')[0] || 'Citizen'} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link
            to="/report"
            className="flex items-center gap-2 px-5 py-2.5 btn-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Report New Issue
          </Link>
        </div>

        {/* Community Score Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Community Score</p>
              <p className="text-5xl font-bold gradient-text font-display">{userProfile?.communityScore || 0}</p>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-400">
                  {userProfile?.badges?.length || 0} badge{userProfile?.badges?.length !== 1 ? 's' : ''} earned
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-wrap gap-2 justify-end mb-3 max-w-xs">
                {(userProfile?.badges || []).slice(0, 3).map((badge, i) => (
                  <span key={i} className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-300">
                    🏆 {badge}
                  </span>
                ))}
                {(!userProfile?.badges?.length) && (
                  <span className="px-2 py-1 bg-slate-500/20 rounded-lg text-xs text-slate-500">
                    No badges yet—start reporting!
                  </span>
                )}
              </div>
              <Link to="/leaderboard" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 justify-end">
                View Leaderboard <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Recent Complaints */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Complaints</h2>
            <Link to="/my-complaints" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-4 skeleton h-20" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium mb-1">No complaints yet</p>
              <p className="text-slate-600 text-sm mb-4">Start by reporting a civic issue in your community</p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-4 py-2 btn-primary text-white text-sm rounded-xl font-medium"
              >
                <Plus className="w-4 h-4" /> Report First Issue
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((complaint, i) => {
                const status = statusConfig[complaint.status] || statusConfig.submitted;
                const severity = severityConfig[complaint.severity] || severityConfig.low;
                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/complaints/${complaint.id}`}
                      className="flex items-center gap-4 p-4 glass rounded-xl hover:border-indigo-500/20 border border-white/5 transition-all group"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severity.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {complaint.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-600">{complaint.category}</span>
                          <span className="text-xs text-slate-700">•</span>
                          <span className="text-xs text-slate-600">
                            {complaint.createdAt instanceof Date
                              ? format(complaint.createdAt, 'MMM d, yyyy')
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${status.bg} ${status.color} flex-shrink-0`}>
                        {status.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/report', icon: Plus, label: 'Report Issue', color: 'from-indigo-500 to-purple-600' },
            { to: '/nearby', icon: MapPin, label: 'Nearby Issues', color: 'from-pink-500 to-rose-600' },
            { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'from-amber-500 to-orange-600' },
            { to: '/my-complaints', icon: TrendingUp, label: 'Track All', color: 'from-emerald-500 to-teal-600' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex flex-col items-center gap-3 p-5 glass rounded-2xl border border-white/5 hover:border-white/10 transition-all card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
