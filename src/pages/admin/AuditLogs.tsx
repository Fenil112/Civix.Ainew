import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { AuditLog } from '../../types';
import { format } from 'date-fns';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        setLogs(
          snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || new Date(),
          })) as AuditLog[]
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Security Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Platform actions audit trail and critical event records</p>
        </div>

        {loading ? (
          <div className="space-y-3 skeleton h-48 rounded-2xl" />
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No security logs recorded yet.</p>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                <div>
                  <p className="text-slate-200 font-semibold">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-1">Performed by: {log.performedBy}</p>
                  {log.details && (
                    <pre className="mt-2 p-2 bg-white/2 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto max-w-full">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {log.timestamp instanceof Date ? format(log.timestamp, 'yyyy-MM-dd HH:mm:ss') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
