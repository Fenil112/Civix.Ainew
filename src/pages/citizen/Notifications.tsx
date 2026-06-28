import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Notification } from '../../types';
import { Bell, Check, Shield, Info, Trophy, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const typeConfig = {
  complaint_update: { icon: Info, bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  achievement: { icon: Trophy, bg: 'bg-amber-500/10', text: 'text-amber-400' },
  nearby_alert: { icon: AlertTriangle, bg: 'bg-orange-500/10', text: 'text-orange-400' },
  leaderboard: { icon: Trophy, bg: 'bg-purple-500/10', text: 'text-purple-400' },
  system: { icon: Shield, bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
        })) as Notification[]
      );
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.isRead) {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      }
    });
    await batch.commit();
  };

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">{notifications.filter(n => !n.isRead).length} unread messages</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">All caught up!</p>
            <p className="text-slate-600 text-sm mt-1">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 p-4 glass rounded-xl border transition-all ${
                    n.isRead ? 'border-white/5 opacity-70' : 'border-indigo-500/20 bg-indigo-600/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">
                        {n.createdAt instanceof Date ? format(n.createdAt, 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{n.message}</p>
                    {n.complaintId && (
                      <Link
                        to={`/complaints/${n.complaintId}`}
                        className="inline-block text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
