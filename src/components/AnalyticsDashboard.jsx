import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Zap, Users, CalendarCheck } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TEAM_MEMBERS } from '../constants/users';

const STATUS_BADGE = {
  'Active':      { label: 'Active',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'In Progress': { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'On Hold':     { label: 'On Hold',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'Completed':   { label: 'Completed',   cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

export default function AnalyticsDashboard({ projects = [], user, onlineCount = 0, totalMembers = 6, attendanceRate = null, loading = false }) {
  // Compute real project count and active sprint count from live data
  const activeProjectCount = projects.length;
  const activeSprintCount = projects.reduce((sum, p) => sum + (p.sprints?.length || 0), 0);

  const stats = [
    {
      label: 'Active Projects',
      value: loading ? '—' : String(activeProjectCount),
      trend: activeProjectCount > 0 ? `${activeProjectCount} running` : 'No projects yet',
      icon: <FolderOpen size={20} className="text-accent" />,
      sparkline: [2, 3, 3, 4, 4, activeProjectCount, activeProjectCount]
    },
    {
      label: 'Active Sprints',
      value: loading ? '—' : String(activeSprintCount),
      trend: activeSprintCount > 0 ? 'On track' : 'None active',
      icon: <Zap size={20} className="text-accent" />,
      sparkline: [1, 2, 2, 3, activeSprintCount, activeSprintCount, activeSprintCount]
    },
    {
      label: 'Team Online',
      value: `${onlineCount}/${totalMembers}`,
      trend: onlineCount === totalMembers ? 'Fully synced' : onlineCount > 0 ? 'Partially online' : 'All offline',
      icon: <Users size={20} className="text-accent" />,
      sparkline: [0, 1, 2, 2, 3, onlineCount, onlineCount]
    },
    {
      label: 'Attendance Rate',
      value: attendanceRate !== null ? `${attendanceRate}%` : '—',
      trend: attendanceRate !== null
        ? attendanceRate >= 90 ? '🟢 Excellent' : attendanceRate >= 70 ? '🟡 Good' : '🔴 Needs attention'
        : 'No data yet',
      icon: <CalendarCheck size={20} className="text-accent" />,
      sparkline: [60, 70, 75, attendanceRate ?? 0, attendanceRate ?? 0, attendanceRate ?? 0, attendanceRate ?? 0]
    },
  ];

  // Derive sprint cards from real project data (first 3 projects)
  const sprintCards = useMemo(() => {
    return projects.slice(0, 3).map(p => {
      const sprint = p.sprints?.[0];
      const sprintName = sprint?.name || 'Sprint 1';

      // Calculate task counts from kanban columns
      const cols = sprint?.columns || {};
      const totalTasks = Object.values(cols).reduce((s, col) => s + (Array.isArray(col) ? col.length : 0), 0);
      const liveTasks = Array.isArray(cols.live) ? cols.live.length : 0;
      const progress = typeof sprint?.progress === 'number'
        ? sprint.progress
        : totalTasks > 0 ? Math.round((liveTasks / totalTasks) * 100) : 0;

      // Map member UIDs to avatars/initials
      const memberChips = (p.members || []).slice(0, 4).map(uid => {
        const m = TEAM_MEMBERS.find(tm => tm.uid === uid);
        return { initial: m?.firstName?.[0] || m?.name?.[0] || '?', avatar: m?.avatar || null };
      });

      const status = p.status || 'Active';
      const badge = STATUS_BADGE[status] || STATUS_BADGE['Active'];

      return {
        id: p._id || p.id,
        name: p.name,
        sprint: sprintName,
        tasks: `${liveTasks}/${totalTasks}`,
        progress,
        status,
        badge,
        memberChips,
      };
    });
  }, [projects]);

  return (
    <div className="space-y-8 pb-10 transition-colors">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-6 rounded-2xl bg-bg-surface border border-border-main shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/10">
                {stat.icon}
              </div>
              <div className="px-2 py-0.5 rounded-full bg-bg-muted text-[10px] font-bold text-text-muted border border-border-main/50 max-w-[120px] truncate text-right">
                {stat.trend}
              </div>
            </div>
            {loading ? (
              <div className="h-10 bg-bg-muted rounded animate-pulse mb-1" />
            ) : (
              <h2 className="text-[38px] font-black tracking-tighter text-text-main mb-1 leading-none">{stat.value}</h2>
            )}
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
            <div className="h-10 w-full mt-5 opacity-60 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stat.sparkline.map(v => ({ value: v }))}>
                  <Line type="monotone" dataKey="value" stroke="var(--theme-accent)" strokeWidth={2} dot={false} isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Projects — real data */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main tracking-tight">Active Projects</h2>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{projects.length} total</span>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-bg-surface border border-dashed border-border-main rounded-2xl text-center">
            <FolderOpen size={32} className="text-text-muted mb-3 opacity-40" />
            <p className="text-sm font-bold text-text-muted">No projects yet</p>
            <p className="text-xs text-text-muted mt-1 opacity-60">Click + New Project to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sprintCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className="bg-bg-surface border border-border-main rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md hover:border-accent/20 transition-all flex flex-col"
              >
                {/* Accent stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-70 group-hover:opacity-100 transition-opacity rounded-l-2xl" />

                <div className="pl-4 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-bg-root border border-border-main px-2 py-0.5 rounded">
                          {card.sprint}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${card.badge.cls}`}>
                          {card.badge.label}
                        </span>
                      </div>
                      <h3 className="font-black text-text-main text-base leading-tight">{card.name}</h3>
                    </div>
                    <span className="text-lg font-black text-text-main leading-none flex-shrink-0 ml-2">{card.progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-bg-root rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                      className="h-full rounded-full bg-accent"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-main/50">
                    <span className="text-[11px] font-bold text-text-muted">{card.tasks} tasks done</span>
                    <div className="flex -space-x-1.5">
                      {card.memberChips.length > 0 ? card.memberChips.map((chip, ci) => (
                        chip.avatar ? (
                          <img key={ci} src={chip.avatar} alt="" className="w-6 h-6 rounded-full border-2 border-bg-surface object-cover" />
                        ) : (
                          <div key={ci} className="w-6 h-6 rounded-full border-2 border-bg-surface bg-text-main text-bg-surface flex items-center justify-center text-[9px] font-black">
                            {chip.initial}
                          </div>
                        )
                      )) : (
                        <span className="text-[10px] text-text-muted">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
