import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminAnalytics() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const snap = await getDocs(collection(db, 'complaints'));
        setComplaints(snap.docs.map(doc => doc.data()) as Complaint[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalData();
  }, []);

  const deptCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
  });

  const deptData = {
    labels: Object.keys(deptCounts),
    datasets: [{
      label: 'Complaints by Department',
      data: Object.values(deptCounts),
      backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#34d399', '#f97316', '#f87171', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  const statusCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  const statusData = {
    labels: Object.keys(statusCounts).map(s => s.toUpperCase()),
    datasets: [{
      label: 'Platform Status',
      data: Object.values(statusCounts),
      backgroundColor: ['#34d399', '#fbbf24', '#f97316', '#f87171', '#6366f1', '#a855f7', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Global Platform Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Cross-department metrics, operational efficiency, and load analysis</p>
        </div>

        {loading ? (
          <div className="h-96 skeleton rounded-2xl" />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Department Load distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <Bar data={deptData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Complaint Lifecycle Status</h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={statusData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
