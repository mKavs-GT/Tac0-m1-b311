import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, Zap, TrendingUp, RefreshCw, User } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants/users';
import { useTeamPresence } from '../hooks/useTeamPresence';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

const STATUS_CONFIG = {
  available:  { color: 'green' },
  focus:      { color: 'green' },
  online:     { color: 'green' },
  break:      { color: 'amber' },
  in_meeting: { color: 'amber' },
  deepwork:   { color: 'purple' },
  deep_work:  { color: 'purple' },
  zen:        { color: 'purple' },
  offline:    { color: 'gray' },
  away:       { color: 'gray' },
  dnd:        { color: 'red' },
};

const STATUS_COLORS = {
  green:  'bg-success',
  purple: 'bg-secondary',
  amber:  'bg-warning',
  red:    'bg-danger',
  gray:   'bg-zinc-400'
};

function formatDuration(secs) {
  if (!secs || secs <= 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function TeamTracker({ user }) {
  const { getMemberPresence } = useTeamPresence(user);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('today');

  const fetchAttendance = useCallback(async (silent = false) => {
    if (!user?.token) return;
    if (!silent) setRefreshing(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/attendance/today`, {
        
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data);
      }
    } catch (e) {
      console.error('TeamTracker: attendance fetch failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchAttendance(true);
    const interval = setInterval(() => fetchAttendance(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // Merge attendance data with team roster + presence
  const teamRows = TEAM_MEMBERS.map(member => {
    const presence = getMemberPresence(member.email);
    const status = presence.status || 'offline';
    const isOnline = presence.isOnline || false;
    const attendance = attendanceData.find(a => a.userId === member.uid || a.user?.uid === member.uid);
    const dotColor = STATUS_COLORS[STATUS_CONFIG[status]?.color || 'gray'];

    return {
      ...member,
      status,
      isOnline,
      dotColor,
      clockInTime: attendance?.clockInTime || null,
      clockOutTime: attendance?.clockOutTime || null,
      totalDuration: attendance?.totalDuration || 0,
      isPresent: attendance?.isPresent || false,
      presenceStatus: attendance?.presenceStatus || null,
    };
  });

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Team Hub</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1">Live attendance, presence, and hours — pulled from the database.</p>
        </div>
        <button
          onClick={() => fetchAttendance()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors rounded-xl hover:bg-bg-muted border border-transparent hover:border-border-main"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Live Presence Heatmap */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-warning" /> Live Presence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {teamRows.map(member => (
                <div key={member.email} className="p-4 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${member.dotColor}`} />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{member.firstName}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-zinc-500">{member.status}</p>
                  {member.isPresent && (
                    <p className="text-[10px] text-success font-semibold mt-1">{formatDuration(member.totalDuration)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Directory with real hours */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col flex-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
              <User size={18} /> Team Directory — Today's Hours
            </h3>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {teamRows.map(member => (
                  <div key={member.email} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-[1.25rem] object-cover ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all" />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${member.dotColor}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{member.name}</h4>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {member.isPresent ? (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Today</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-white">{formatDuration(member.totalDuration)}</p>
                          {member.clockInTime && (
                            <p className="text-[10px] text-zinc-400 flex items-center gap-1 justify-end mt-0.5">
                              <Clock size={9} />
                              {new Date(member.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {member.presenceStatus === 'clocked-out' && member.clockOutTime && (
                                <> → {new Date(member.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Not checked in</span>
                      )}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${member.isOnline ? 'bg-success/10 text-success' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${member.dotColor}`} />
                        {member.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Velocity Metrics */}
        <div className="flex flex-col gap-8">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-success-tint rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
              <Zap size={16} className="text-success" /> Today's Presence
            </h3>
            <div className="relative z-10 space-y-2">
              <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {teamRows.filter(m => m.isPresent).length}
                <span className="text-sm font-bold text-zinc-500 ml-2">/ {teamRows.length}</span>
              </p>
              <p className="text-xs font-bold text-success uppercase tracking-widest">Members checked in today</p>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${Math.round((teamRows.filter(m => m.isPresent).length / teamRows.length) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Online Now
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {teamRows.filter(m => m.isOnline).length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">Nobody online right now.</p>
              ) : (
                teamRows.filter(m => m.isOnline).map(member => (
                  <div key={member.email} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-50 dark:border-zinc-950 ${member.dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{member.firstName}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{member.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
