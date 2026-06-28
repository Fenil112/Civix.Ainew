import { useEffect, useState, Fragment } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, updateDoc, increment, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint, Comment } from '../../types';
import {
  MapPin, Clock, Building2, Users, MessageSquare, ChevronLeft,
  CheckCircle, Send, ThumbsUp, Brain, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  submitted: { label: 'Submitted', color: 'text-slate-400', bg: 'bg-slate-400/15', icon: Clock },
  verified: { label: 'Verified', color: 'text-sky-400', bg: 'bg-sky-400/15', icon: CheckCircle },
  assigned: { label: 'Assigned', color: 'text-amber-400', bg: 'bg-amber-400/15', icon: Users },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-400/15', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-indigo-400', bg: 'bg-indigo-400/15', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/15', icon: AlertTriangle },
};

const TIMELINE_STEPS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [supported, setSupported] = useState(false);

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
        if (user) setSupported(data.supporters?.includes(user.uid));
      }
      setLoading(false);
    });

    const commentsUnsub = onSnapshot(
      query(
        collection(db, 'comments'),
        where('complaintId', '==', id),
        orderBy('createdAt', 'asc')
      ),
      (snap) => {
        setComments(snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
        })) as Comment[]);
      }
    );

    return () => { unsub(); commentsUnsub(); };
  }, [id, user]);

  const handleSupport = async () => {
    if (!user || !complaint || supported) return;
    await updateDoc(doc(db, 'complaints', complaint.id), {
      supporterCount: increment(1),
      supporters: [...(complaint.supporters || []), user.uid],
    });
    setSupported(true);
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user || !userProfile) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        complaintId: id,
        userId: user.uid,
        userName: userProfile.displayName,
        userAvatar: userProfile.photoURL || '',
        userRole: userProfile.role,
        text: comment,
        isOfficial: userProfile.role !== 'citizen',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'complaints', id!), { commentCount: increment(1) });
      setComment('');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="citizen">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl p-6 skeleton h-32" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!complaint) {
    return (
      <DashboardLayout role="citizen">
        <div className="text-center py-20">
          <p className="text-slate-400">Complaint not found</p>
          <Link to="/my-complaints" className="text-indigo-400 mt-2 block hover:text-indigo-300">Go back</Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatus = statusConfig[complaint.status] || statusConfig.submitted;
  const currentStepIndex = TIMELINE_STEPS.indexOf(complaint.status);

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back & Header */}
        <div>
          <Link to="/my-complaints" className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-300 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> My Complaints
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-display">{complaint.title}</h1>
              <p className="text-slate-500 text-sm mt-1">
                #{complaint.id.slice(0, 8).toUpperCase()} • {complaint.category}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${currentStatus.bg} ${currentStatus.color} flex-shrink-0`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Complaint Progress</h2>
          <div className="flex items-center gap-2">
            {TIMELINE_STEPS.map((step, i) => {
              const cfg = statusConfig[step];
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <Fragment key={step}>
                  <div className={`flex flex-col items-center gap-1.5 ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      isDone
                        ? `border-emerald-500 bg-emerald-500/20`
                        : 'border-slate-700 bg-slate-800'
                    }`}>
                      {isDone && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className={`text-[9px] font-medium text-center ${isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-px mt-[-12px] ${i < currentStepIndex ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* Timeline Events */}
          <div className="mt-6 space-y-3">
            {complaint.timeline?.slice().reverse().map((event, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                <div>
                  <span className="text-slate-300">{event.message}</span>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {event.timestamp instanceof Date ? format(event.timestamp, 'MMM d, yyyy h:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Details */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Issue Details</h2>
            <div className="space-y-3 text-sm">
              <p className="text-slate-300 leading-relaxed">{complaint.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Severity', value: complaint.severity, color: 'capitalize' },
                  { label: 'Urgency', value: `${complaint.urgencyScore}/100` },
                  { label: 'Est. Time', value: complaint.estimatedRepairTime },
                  { label: 'Est. Cost', value: complaint.estimatedCost },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className={`text-slate-300 font-medium mt-0.5 ${item.color || ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Assignment */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Location
              </h3>
              <p className="text-slate-300 text-sm">{complaint.location?.address || 'Location not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" /> Department
              </h3>
              <p className="text-slate-300 text-sm">{complaint.department}</p>
            </div>
            {complaint.assignedAuthorityName && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Assigned Officer</h3>
                <p className="text-slate-300 text-sm">{complaint.assignedAuthorityName}</p>
              </div>
            )}

            {/* Support Button */}
            <button
              onClick={handleSupport}
              disabled={supported || complaint.citizenId === user?.uid}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                supported
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'glass border border-white/10 text-slate-400 hover:border-indigo-500/30 hover:text-indigo-400'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {supported ? 'You Supported This' : `Support (${complaint.supporterCount || 1})`}
            </button>
          </div>
        </div>

        {/* Photos */}
        {complaint.photos?.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Attached Media</h2>
            <div className="grid grid-cols-3 gap-3">
              {complaint.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} className="w-full h-32 object-cover rounded-xl hover:opacity-80 transition-opacity" alt="" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {complaint.aiAnalysis && (
          <div className="glass rounded-2xl p-6 border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">AI Insights</h2>
            </div>
            <p className="text-slate-300 text-sm">{complaint.aiAnalysis.impactSummary}</p>
            {complaint.aiAnalysis.recommendations && (
              <p className="text-slate-400 text-sm mt-2">{complaint.aiAnalysis.recommendations}</p>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userProfile?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 relative">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full input-dark rounded-xl px-4 py-2.5 pr-12 text-sm"
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    c.userRole === 'authority' ? 'bg-emerald-600 text-white' :
                    c.userRole === 'admin' ? 'bg-amber-600 text-white' :
                    'bg-indigo-600 text-white'
                  }`}>
                    {c.userName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300">{c.userName}</span>
                      {c.isOfficial && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Official</span>
                      )}
                      <span className="text-xs text-slate-600">
                        {c.createdAt instanceof Date ? format(c.createdAt, 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
