import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AuthorityAnalytics() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userProfile?.department) return;
      try {
        const q = query(collection(db, 'complaints'), where('department', '==', userProfile.department));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data()) as Complaint[];
        setComplaints(data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [userProfile]);

  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  complaints.forEach(c => {
    if (severityCounts[c.severity] !== undefined) {
      severityCounts[c.severity]++;
    }
  });

  const severityData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [{
      label: 'Complaints by Severity',
      data: [severityCounts.low, severityCounts.medium, severityCounts.high, severityCounts.critical],
      backgroundColor: ['#34d399', '#fbbf24', '#f97316', '#f87171'],
      borderWidth: 0,
    }]
  };

  const statusCounts: Record<string, number> = {};
  complaints.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  const statusData = {
    labels: Object.keys(statusCounts).map(s => s.toUpperCase().replace('_', ' ')),
    datasets: [{
      label: 'Complaints by Status',
      data: Object.values(statusCounts),
      backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#34d399', '#f97316', '#f87171', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  return (
    <DashboardLayout role="authority">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Analytics & Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Operational efficiency analytics for {userProfile?.department}</p>
        </div>

        {loading ? (
          <div className="h-96 skeleton rounded-2xl" />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Severity Breakdown</h3>
              <div className="h-64 flex items-center justify-center">
                <Pie data={severityData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Status Breakdown</h3>
              <div className="h-64 flex items-center justify-center">
                <Bar data={statusData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
