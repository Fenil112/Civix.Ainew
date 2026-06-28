import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { LeaderboardEntry } from '../../types';
import { Trophy, Medal, Award, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Leaderboard() {
  const { userProfile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [scope, setScope] = useState<'city' | 'global'>('global');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'users'),
          orderBy('communityScore', 'desc'),
          limit(20)
        );

        if (scope === 'city' && userProfile?.city) {
          q = query(
            collection(db, 'users'),
            where('city', '==', userProfile.city),
            orderBy('communityScore', 'desc'),
            limit(20)
          );
        }

        const snap = await getDocs(q);
        const data = snap.docs.map((doc, index) => {
          const u = doc.data();
          return {
            userId: doc.id,
            userName: u.displayName || 'Anonymous Citizen',
            userAvatar: u.photoURL || '',
            city: u.city || 'Unknown City',
            ward: u.ward || '',
            score: u.communityScore || 0,
            totalComplaints: u.totalComplaints || 0,
            resolvedComplaints: u.resolvedComplaints || 0,
            badges: u.badges || [],
            rank: index + 1,
            period
          } as LeaderboardEntry;
        });

        setEntries(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period, scope, userProfile]);

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Community Leaderboard</h1>
            <p className="text-slate-500 text-sm mt-1">Recognizing top active citizens improving our cities</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="input-dark rounded-xl px-4 py-2 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="alltime">All-Time</option>
            </select>

            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="input-dark rounded-xl px-4 py-2 text-sm"
            >
              <option value="global">Global</option>
              {userProfile?.city && <option value="city">{userProfile.city}</option>}
            </select>
          </div>
        </div>

        {/* Top 3 Cards */}
        {!loading && entries.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* 2nd Place */}
            <div className="glass rounded-2xl p-6 text-center border border-slate-700/50 order-2 md:order-1 relative mt-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center border-4 border-surface-900 shadow-lg">
                <Medal className="w-5 h-5 text-surface-900" />
              </div>
              <div className="mt-4">
                {entries[1].userAvatar ? (
                  <img src={entries[1].userAvatar} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-400" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto flex items-center justify-center text-white text-xl font-bold border-2 border-slate-400">
                    {entries[1].userName[0]}
                  </div>
                )}
                <h3 className="text-white font-semibold mt-3 truncate">{entries[1].userName}</h3>
                <p className="text-slate-500 text-xs mt-1">{entries[1].city}</p>
                <div className="mt-4 px-4 py-1.5 bg-slate-500/10 border border-slate-400/20 rounded-xl inline-block">
                  <span className="text-slate-300 font-bold font-display">{entries[1].score} pts</span>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="glass rounded-2xl p-6 text-center border border-indigo-500/30 order-1 md:order-2 relative transform md:scale-105 glow-primary">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center border-4 border-surface-900 shadow-lg">
                <Trophy className="w-5 h-5 text-surface-900" />
              </div>
              <div className="mt-4">
                {entries[0].userAvatar ? (
                  <img src={entries[0].userAvatar} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-400" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 mx-auto flex items-center justify-center text-white text-2xl font-bold border-2 border-amber-400">
                    {entries[0].userName[0]}
                  </div>
                )}
                <h3 className="text-white font-bold mt-3 text-lg truncate">{entries[0].userName}</h3>
                <p className="text-slate-400 text-xs mt-1">{entries[0].city}</p>
                <div className="mt-4 px-4 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-xl inline-block">
                  <span className="text-amber-400 font-bold font-display">{entries[0].score} pts</span>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="glass rounded-2xl p-6 text-center border border-slate-700/50 order-3 relative mt-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center border-4 border-surface-900 shadow-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="mt-4">
                {entries[2].userAvatar ? (
                  <img src={entries[2].userAvatar} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-700" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto flex items-center justify-center text-white text-xl font-bold border-2 border-amber-700">
                    {entries[2].userName[0]}
                  </div>
                )}
                <h3 className="text-white font-semibold mt-3 truncate">{entries[2].userName}</h3>
                <p className="text-slate-500 text-xs mt-1">{entries[2].city}</p>
                <div className="mt-4 px-4 py-1.5 bg-amber-700/10 border border-amber-700/20 rounded-xl inline-block">
                  <span className="text-amber-600 font-bold font-display">{entries[2].score} pts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Rankings</h2>
            <span className="text-xs text-slate-500">Updated hourly</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No entries found. Be the first to earn points!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {entries.map((entry) => {
                const isCurrentUser = entry.userId === userProfile?.uid;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                      isCurrentUser ? 'bg-indigo-600/5 border-l-2 border-indigo-500' : 'hover:bg-white/1'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex-shrink-0 text-center">
                      {entry.rank === 1 ? (
                        <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
                      ) : entry.rank === 2 ? (
                        <Medal className="w-5 h-5 text-slate-400 mx-auto" />
                      ) : entry.rank === 3 ? (
                        <Award className="w-5 h-5 text-amber-700 mx-auto" />
                      ) : (
                        <span className="text-sm font-semibold text-slate-500 font-display">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    {entry.userAvatar ? (
                      <img src={entry.userAvatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {entry.userName[0]}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 truncate">{entry.userName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {entry.city}</span>
                        <span>•</span>
                        <span>{entry.resolvedComplaints} resolved</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-white font-display">{entry.score}</p>
                      <p className="text-[10px] text-slate-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
