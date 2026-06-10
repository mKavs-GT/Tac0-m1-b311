import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Zap, Users, CalendarCheck } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants/users';

// Pure SVG sparkline — no library dependency, guaranteed to render
function Sparkline({ data = [], color = 'var(--theme-accent)' }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_BADGE = {
  'Active':      { label: 'Active',      cls: 'bg-success-tint text-success' },
  'In Progress': { label: 'In Progress', cls: 'bg-primary-tint text-primary' },
  'On Hold':     { label: 'On Hold',     cls: 'bg-warning-tint text-warning' },
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
            className="p-5 rounded-2xl bg-bg-surface border border-border-main border-l-4 border-l-primary shadow-card hover:-translate-y-0.5 transition-all group relative flex flex-col"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {loading ? (
                  <div className="h-10 w-16 bg-bg-muted rounded animate-pulse mb-1" />
                ) : (
                  <h2 className="text-4xl font-black text-text-main leading-none mb-1">{stat.value}</h2>
                )}
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{stat.label}</p>
              </div>
              <div className="text-text-muted opacity-60">
                {/* Icon is already 20px but let's just render stat.icon */}
                {stat.icon}
              </div>
            </div>
            
            <div className="text-xs text-text-muted mt-2">
              {stat.trend}
            </div>

            <div className="h-10 w-full mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
              <Sparkline data={stat.sparkline} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Projects — real data */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-main tracking-tight">Active Projects</h2>
          <span className="text-sm font-medium text-text-muted">{projects.length} total</span>
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
