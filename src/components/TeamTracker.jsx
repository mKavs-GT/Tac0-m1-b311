import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, ChevronDown, User, Calendar, Activity, Zap, TrendingUp } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants/users';
import { useTeamPresence } from '../hooks/useTeamPresence';

const STATUS_CONFIG = {
  focus: { color: 'green' },
  break: { color: 'amber' },
  deepwork: { color: 'purple' },
  offline: { color: 'gray' },
  zen: { color: 'purple' }
};

const statusColors = {
  green: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  gray: 'bg-zinc-400'
};

const mockTeamData = [
  { id: 1, name: 'Krishawn Rahul', role: 'Executive Admin', avatar: '/team/mrk.jpg', daily: '9.5h', weekly: '48h', monthly: '190h', status: 'online', tasks: 2 },
  { id: 2, name: 'Sitesh', role: 'Business Head', avatar: '/team/mrz.jpeg', daily: '7.5h', weekly: '35h', monthly: '150h', status: 'online', tasks: 4 },
  { id: 3, name: 'Vinith Vijaya', role: 'Executive', avatar: '/team/mrv.jpg', daily: '8.1h', weekly: '40h', monthly: '160h', status: 'offline', tasks: 1 },
  { id: 4, name: 'Sofia Stalance', role: 'Developer', avatar: '/team/mrss.jpg', daily: '6.5h', weekly: '32h', monthly: '140h', status: 'online', tasks: 3 },
  { id: 5, name: 'Michael Antony', role: 'Developer', avatar: '/team/mrm.jpeg', daily: '8.0h', weekly: '40h', monthly: '160h', status: 'online', tasks: 12 },
  { id: 6, name: 'Mohammed Abuzar', role: 'Designer', avatar: '/team/mra.jpeg', daily: '4.2h', weekly: '28h', monthly: '120h', status: 'offline', tasks: 5 },
];

const mockRequests = [
  { id: 101, name: 'Sofia Stalance', date: 'Apr 22', total: '6h', breakdown: '4h on Dashboard UI, 2h on API Auth', avatar: '/team/mrss.jpg' },
  { id: 102, name: 'Michael Antony', date: 'Apr 21', total: '8h', breakdown: '5h on Backend Setup, 3h on DB Migration', avatar: '/team/mrm.jpeg' },
];

export default function TeamTracker({ user }) {
  const { getMemberPresence } = useTeamPresence(user);
  const [timeFilter, setTimeFilter] = useState('weekly'); // daily, weekly, monthly
  const [requests, setRequests] = useState(mockRequests);

  const handleRequest = (id, action) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Team Tracker</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1">Admin oversight for employee hours, workload, and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Team Heatmap & Directory */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Workload Heatmap */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
             <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={16} className="text-amber-500" /> Workload Heatmap
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                {TEAM_MEMBERS.map(member => {
                  const presence = getMemberPresence(member.email);
                  const status = presence.status || 'offline';
                  const isOnline = presence.isOnline || false;
                  
                  const statusColorClass = statusColors[STATUS_CONFIG[status]?.color || 'gray'];
                  
                  return (
                    <div key={`heat-${member.email}`} className="p-4 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center text-center transition-all">
                      <div className="relative mb-2">
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${statusColorClass}`}></div>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{member.firstName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-zinc-500">{status}</p>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Directory */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col flex-1">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <User size={18} /> Directory
              </h3>
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                {['daily', 'weekly', 'monthly'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                      timeFilter === f 
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 hide-scrollbar">
              {TEAM_MEMBERS.map(member => {
                const presence = getMemberPresence(member.email);
                const status = presence.status || 'offline';
                const isOnline = presence.isOnline || false;
                
                const statusColorClass = statusColors[STATUS_CONFIG[status]?.color || 'gray'];
                
                return (
                  <div key={member.email} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-[1.25rem] object-cover ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all" />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${statusColorClass}`}></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{member.name}</h4>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{status.toUpperCase()}</p>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {presence?.updatedAt ? new Date(presence.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Time Sheet Approvals & Performance */}
        <div className="flex flex-col gap-8 h-full">
          
          {/* Performance Metrics */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
             <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                <Zap size={16} className="text-emerald-500" /> Velocity Metrics
             </h3>
             <div className="relative z-10">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg. Time: Backlog → Live</p>
               <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-end gap-2">
                 4.2 <span className="text-sm font-bold text-zinc-500 mb-1">Days</span>
               </p>
               <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
               </div>
               <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-widest">+12% faster than last sprint</p>
             </div>
          </div>

          {/* Team Insights */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden flex-1">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Active Performance
                </h3>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                   <TrendingUp size={32} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">System Optimized</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">All agents performing within target velocity</p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
