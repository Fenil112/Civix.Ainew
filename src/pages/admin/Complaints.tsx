import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import { toast } from 'react-hot-toast';
import { Search } from 'lucide-react';

const DEPARTMENTS = [
  'Roads & Highways',
  'Water Supply & Sewerage',
  'Electricity & Lighting',
  'Public Safety & Police',
  'Garbage & Sanitation',
  'Parks & Forestry',
  'Building & Town Planning'
];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'complaints'));
      setComplaints(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Complaint[]
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleToggleSpam = async (c: Complaint) => {
    try {
      await updateDoc(doc(db, 'complaints', c.id), {
        isSpam: !c.isSpam,
        updatedAt: serverTimestamp(),
      });
      toast.success(c.isSpam ? 'Marked as valid report' : 'Marked as spam');
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReassignDept = async (id: string, dept: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        department: dept,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Complaint reassigned to ${dept}`);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = complaints.filter(
    (c) =>
      (c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())) &&
      (filterDept === 'all' || c.department === filterDept)
  );

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Global Complaint Console</h1>
          <p className="text-slate-500 text-sm mt-1">Supervise reported issues, reassign departments, and handle spam reports</p>
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
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="input-dark rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 skeleton h-48 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No complaints found matching filters.</p>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/1 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">#{c.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <p className={`text-sm font-semibold text-slate-200 truncate ${c.isSpam ? 'line-through text-slate-600' : ''}`}>
                      {c.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Current Department: <span className="text-indigo-400 font-semibold">{c.department}</span></p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    onChange={(e) => handleReassignDept(c.id, e.target.value)}
                    value={c.department}
                    className="input-dark rounded-lg px-2.5 py-1 text-xs"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleToggleSpam(c)}
                    className={`px-3 py-1 text-xs font-semibold border rounded-lg transition-all ${
                      c.isSpam
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.isSpam ? 'Mark Valid' : 'Flag Spam'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
