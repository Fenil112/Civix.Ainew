import { useEffect, useState } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { UserProfile, AuditLog } from '../../types';
import { Link } from 'react-router-dom';
import { Users, Building2, AlertTriangle, FileText, ArrowRight, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, authorities: 0, complaints: 0, pendingAuthorities: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersSnap, complaintsSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'complaints')),
          getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5)))
        ]);

        const allUsers = usersSnap.docs.map(d => d.data()) as UserProfile[];
        const complaintsCount = complaintsSnap.size;

        setStats({
          users: allUsers.filter(u => u.role === 'citizen').length,
          authorities: allUsers.filter(u => u.role === 'authority').length,
          complaints: complaintsCount,
          pendingAuthorities: allUsers.filter(u => u.role === 'authority' && !u.isVerified).length,
        });

        setRecentLogs(
          logsSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.() || new Date()
          })) as AuditLog[]
        );
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Administrator Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform administration, authority approvals, and security auditing</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { label: 'Registered Citizens', value: stats.users, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            { label: 'Official Authorities', value: stats.authorities, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Total Complaints', value: stats.complaints, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Pending Approvals', value: stats.pendingAuthorities, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold font-display mt-2 text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick management cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Audit Logs */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> Recent Security Audit Logs
              </h2>
              <Link to="/admin/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                All Logs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 skeleton h-32 rounded-xl" />
            ) : recentLogs.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No actions logged yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="text-xs flex justify-between items-start gap-4 p-2.5 rounded-lg bg-white/2">
                    <div>
                      <p className="text-slate-300 font-semibold">{log.action}</p>
                      <p className="text-slate-500 mt-0.5">By {log.performedBy}</p>
                    </div>
                    <span className="text-slate-600">
                      {log.timestamp instanceof Date ? format(log.timestamp, 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shortcut panel */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Management Console</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Manage Citizens', to: '/admin/users', desc: 'Verify or suspend citizen profiles' },
                { label: 'Manage Authorities', to: '/admin/authorities', desc: 'Approve official accounts' },
                { label: 'Global Complaints', to: '/admin/complaints', desc: 'Spam filters and reassignments' },
                { label: 'Platform Analytics', to: '/admin/analytics', desc: 'Review metrics & resolution trends' },
              ].map((shortcut) => (
                <Link
                  key={shortcut.label}
                  to={shortcut.to}
                  className="p-4 rounded-xl border border-white/5 bg-white/1 hover:border-indigo-500/20 transition-all flex flex-col justify-between"
                >
                  <span className="text-sm font-semibold text-slate-200">{shortcut.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{shortcut.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
