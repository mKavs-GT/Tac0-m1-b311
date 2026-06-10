import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, User, AlertCircle, UserCheck, RefreshCw, CalendarDays } from 'lucide-react';
import { API_BASE_URL } from '../config';

function formatTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(secs) {
  if (!secs || secs <= 0) return '0h 0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function StatusBadge({ record }) {
  if (record.presenceStatus === 'clocked-in') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Clocked In
      </span>
    );
  }
  if (record.presenceStatus === 'clocked-out') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <CheckCircle size={11} /> Done
      </span>
    );
  }
  if (record.isPresent) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <CheckCircle size={11} /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <XCircle size={11} /> Absent
    </span>
  );
}

export default function Attendance({ user }) {
  const [todayRecords, setTodayRecords] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchToday = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setTodayRecords(await res.json());
    } catch (e) { console.error('Attendance fetch failed', e); }
    finally { setRefreshing(false); }
  }, [user.token]);

  const fetchMyStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/stats`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setMyStats(await res.json());
    } catch (e) { console.error('Stats fetch failed', e); }
  }, [user.token]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchToday(true), fetchMyStats()]);
      setLoading(false);
    };
    init();

    // Poll every 30s as baseline
    const interval = setInterval(() => { fetchToday(true); fetchMyStats(); }, 30000);

    // Bug #3: Also refresh immediately when a clock event fires from anywhere in the app
    const handleClockEvent = () => {
      fetchToday(true);
      fetchMyStats();
    };
    window.addEventListener('mkavs-timer-stopped', handleClockEvent);
    window.addEventListener('mkavs-clock-updated', handleClockEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mkavs-timer-stopped', handleClockEvent);
      window.removeEventListener('mkavs-clock-updated', handleClockEvent);
    };
  }, [fetchToday, fetchMyStats]);

  const handleApprove = async (userId) => {
    setActionLoading(userId + '_approve');
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/approve/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) await fetchToday(true);
    } catch (e) { console.error('Approve failed', e); }
    finally { setActionLoading(null); }
  };

  const handleRevoke = async (userId) => {
    setActionLoading(userId + '_revoke');
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/revoke/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) await fetchToday(true);
    } catch (e) { console.error('Revoke failed', e); }
    finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-3">
            <CalendarDays size={24} className="text-accent" />
            Attendance
          </h2>
          <p className="text-sm font-medium text-text-muted mt-1">{todayStr}</p>
        </div>
        <button
          onClick={() => fetchToday()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors rounded-xl hover:bg-bg-muted border border-transparent hover:border-border-main"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* My Status Card */}
      {myStats !== null && (
        <div className="bg-bg-surface border border-border-main rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5">My Attendance Today</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-bg-root rounded-xl p-4 text-center border border-border-main">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Status</p>
              <div className="flex justify-center">
                {myStats.isPresent ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle size={12} /> Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <XCircle size={12} /> Pending
                  </span>
                )}
              </div>
            </div>
            <div className="bg-bg-root rounded-xl p-4 text-center border border-border-main">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Clock In</p>
              <p className="text-xl font-black text-text-main font-mono">{formatTime(myStats.clockInTime)}</p>
            </div>
            <div className="bg-bg-root rounded-xl p-4 text-center border border-border-main">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Clock Out</p>
              <p className="text-xl font-black text-text-main font-mono">{formatTime(myStats.clockOutTime)}</p>
            </div>
            <div className="bg-bg-root rounded-xl p-4 text-center border border-border-main">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Total</p>
              <p className="text-xl font-black text-text-main">{formatDuration(myStats.totalDurationToday)}</p>
            </div>
          </div>

          <AnimatePresence>
            {!myStats.isPresent && !user?.isExecutive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <p className="text-xs font-semibold">
                    Your attendance hasn't been approved yet for today. Please wait for Mr.K to mark you present before clocking in.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Team Attendance Panel — Executive only */}
      {user?.isExecutive && (
        <div className="bg-bg-surface border border-border-main rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <UserCheck size={18} className="text-accent" />
              Team Attendance — Approve / Revoke
            </h3>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {todayRecords.filter(r => r.isPresent || r._isSelf || r.userId === user?.id).length}/{todayRecords.length} Approved
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {todayRecords.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm">No team members found.</div>
            ) : (
              todayRecords.map((record) => {
                const isApproving = actionLoading === record.userId + '_approve';
                const isRevoking = actionLoading === record.userId + '_revoke';
                const isActing = isApproving || isRevoking;

                return (
                  <motion.div
                    key={record.userId}
                    layout
                    className="flex items-center justify-between p-4 rounded-xl bg-bg-root border border-border-main hover:border-accent/20 transition-colors"
                  >
                    {/* Member info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {record.user?.avatar ? (
                        <img
                          src={record.user.avatar}
                          alt={record.user.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-accent" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-main truncate">
                          {record.user?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">{record.user?.role || ''}</p>
                      </div>
                    </div>

                    {/* Right side: times + status + actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Times (hidden on small) */}
                      <div className="hidden lg:flex items-center gap-3 text-[11px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          In: {formatTime(record.clockInTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Out: {formatTime(record.clockOutTime)}
                        </span>
                        <span className="font-semibold text-text-main">
                          {formatDuration(record.totalDuration)}
                        </span>
                      </div>

                      <StatusBadge record={record} />

                      {/* Action buttons — hide for Mr.K's own row */}
                      {record._isSelf ? (
                        <span className="px-3 py-1.5 text-xs font-bold bg-accent/10 text-accent rounded-lg min-w-[88px] text-center">
                          You ✓
                        </span>
                      ) : !record.isPresent ? (
                        <button
                          onClick={() => handleApprove(record.userId)}
                          disabled={isActing}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[88px] justify-center"
                        >
                          {isApproving ? (
                            <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                          ) : (
                            <><CheckCircle size={12} /> Approve</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevoke(record.userId)}
                          disabled={isActing}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:text-rose-400 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[88px] justify-center"
                        >
                          {isRevoking ? (
                            <span className="w-3 h-3 rounded-full border border-rose-500/30 border-t-rose-500 animate-spin" />
                          ) : (
                            <><XCircle size={12} /> Revoke</>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Non-executive tip */}
      {!user?.isExecutive && (
        <div className="bg-bg-surface border border-border-main rounded-2xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-accent" />
          </div>
          <p className="text-sm font-bold text-text-main mb-1">Clock In via Mission Control</p>
          <p className="text-xs text-text-muted max-w-xs mx-auto">
            Use the <strong>Clock In / Clock Out</strong> button on the Mission Control tab once Mr.K approves your attendance for the day.
          </p>
        </div>
      )}
    </div>
  );
}
