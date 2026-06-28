import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint, ComplaintStatus } from '../../types';
import { toast } from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: 'verified', label: 'Verify Complaint' },
  { value: 'assigned', label: 'Assign Workers' },
  { value: 'in_progress', label: 'Start Progress' },
  { value: 'resolved', label: 'Resolve & Upload Proof' },
  { value: 'closed', label: 'Close Complaint' },
  { value: 'rejected', label: 'Reject Complaint' },
];

export default function AuthorityComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [timelineMessage, setTimelineMessage] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [repairImage, setRepairImage] = useState<File | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'complaints', id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setComplaint({
          id: snap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          timeline: (data.timeline || []).map((t: any) => ({
            ...t,
            timestamp: t.timestamp?.toDate?.() || new Date(),
          })),
        } as Complaint);
        setStatus(data.status);
        setWorkerName(data.workerAssigned || '');
        setResolutionNote(data.resolutionNote || '');
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleUpdateStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !status || !complaint) return;
    setSubmitting(true);

    try {
      let repairImageUrl = '';
      if (status === 'resolved' && repairImage) {
        repairImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(repairImage);
        });
      }

      const timelineEvent = {
        status,
        timestamp: new Date(),
        message: timelineMessage || `Status updated to ${status.replace('_', ' ')} by Authority.`,
        updatedBy: user?.uid,
      };

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        timeline: arrayUnion(timelineEvent),
      };

      if (workerName) updateData.workerAssigned = workerName;
      if (resolutionNote) updateData.resolutionNote = resolutionNote;
      if (repairImageUrl) updateData.repairImages = arrayUnion(repairImageUrl);

      await updateDoc(doc(db, 'complaints', id), updateData);

      // Notify citizen of the update
      await addDoc(collection(db, 'notifications'), {
        userId: complaint.citizenId,
        title: `Complaint Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
        message: `Your complaint "${complaint.title}" has been updated to "${status.replace('_', ' ')}". Note: ${timelineMessage || 'No extra info provided.'}`,
        type: 'complaint_update',
        complaintId: id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      toast.success('Complaint status updated!');
      setTimelineMessage('');
      setRepairImage(null);
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="authority">
        <div className="max-w-4xl mx-auto space-y-4 skeleton h-96 rounded-2xl" />
      </DashboardLayout>
    );
  }

  if (!complaint) {
    return (
      <DashboardLayout role="authority">
        <div className="text-center py-20 text-slate-500">Complaint not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="authority">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link to="/authority/complaints" className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-300 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Complaints
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white font-display">{complaint.title}</h1>
              <p className="text-slate-500 text-xs mt-1">ID: #{complaint.id.toUpperCase()} • Reported by {complaint.citizenName}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 uppercase">
              {complaint.status}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Citizen Report Details</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{complaint.description}</p>
              
              {complaint.photos?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Citizen Uploads</p>
                  <div className="grid grid-cols-3 gap-3">
                    {complaint.photos.map((p, i) => (
                      <a href={p} target="_blank" rel="noreferrer" key={i}>
                        <img src={p} className="w-full h-24 object-cover rounded-xl border border-white/10" alt="" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Timeline Activity</h2>
              <div className="space-y-4">
                {complaint.timeline?.map((t, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-300 font-semibold">{t.status.toUpperCase()}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{t.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{t.timestamp instanceof Date ? format(t.timestamp, 'MMM d, yyyy h:mm a') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-indigo-500/10">
              <h3 className="text-base font-semibold text-white mb-4">Action Panel</h3>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                    className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                    required
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {status === 'assigned' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Assign Worker/Crew Name</label>
                    <input
                      type="text"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      className="w-full input-dark rounded-xl px-4 py-2.5 text-sm"
                      placeholder="e.g. Crew A, John Doe"
                      required
                    />
                  </div>
                )}

                {status === 'resolved' && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Resolution Note</label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="w-full input-dark rounded-xl p-3 text-sm"
                        placeholder="Explain resolution actions..."
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Upload Repair Image Proof</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setRepairImage(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 file:cursor-pointer"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Timeline Message / Update Info</label>
                  <textarea
                    value={timelineMessage}
                    onChange={(e) => setTimelineMessage(e.target.value)}
                    className="w-full input-dark rounded-xl p-3 text-sm"
                    placeholder="Enter update description..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 btn-primary text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Apply Status Update'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
