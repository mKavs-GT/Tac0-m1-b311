import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Clock, Plus, User, MessageSquare, Zap, 
  LogIn, LogOut, ArrowRight, Activity, Globe, Wifi, WifiOff 
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { EmptyState } from './ui/EmptyState';
import { apiFetch } from '../utils/api';

const ACTION_CONFIG = {
  LOGIN: { label: 'logged in', icon: <LogIn size={14} className="text-emerald-500" />, bgColor: 'bg-emerald-50' },
  LOGOUT: { label: 'logged out', icon: <LogOut size={14} className="text-rose-500" />, bgColor: 'bg-rose-50' },
  TIMER_START: { label: 'started timer', icon: <Zap size={14} className="text-amber-500" />, bgColor: 'bg-amber-50' },
  TIMER_STOP: { label: 'stopped timer', icon: <Zap size={14} className="text-text-muted" />, bgColor: 'bg-bg-muted' },
  STATUS_CHANGE: { label: 'updated status', icon: <Activity size={14} className="text-indigo-500" />, bgColor: 'bg-indigo-50 dark:bg-indigo-500/10' },
  TASK_MOVE: { label: 'moved task', icon: <ArrowRight size={14} className="text-blue-500" />, bgColor: 'bg-blue-50 dark:bg-blue-500/10' },
  TASK_CREATE: { label: 'created project', icon: <Plus size={14} className="text-brand-purple" />, bgColor: 'bg-bg-muted' },
  CHATBOT_ONLINE: { label: 'went live on chatbot', icon: <Wifi size={14} className="text-emerald-500" />, bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' },
  CHATBOT_OFFLINE: { label: 'went offline on chatbot', icon: <WifiOff size={14} className="text-text-muted" />, bgColor: 'bg-bg-muted' },
};

export default function RecentActivityPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/admin/audit-logs`, {
        headers: authHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden shadow-sm transition-colors">
      <div className="px-4 py-3 bg-bg-root border-b border-border-main flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-brand-purple dark:text-purple-400" />
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Audit Log / Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Live Updates</span>
        </div>
      </div>
      
      <div className="divide-y divide-border-main max-h-[600px] overflow-y-auto custom-scrollbar">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6a737d]">Loading activities...</div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={Activity}
              title="No activities found"
              subtitle="System and user activities will appear here"
            />
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {logs.map((log, i) => {
              const config = ACTION_CONFIG[log.action] || { label: log.action.toLowerCase(), icon: <Activity size={14} />, bgColor: 'bg-gray-50' };
              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-4 hover:bg-bg-root transition-colors group relative"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-zinc-900 flex items-center justify-center text-white text-xs font-bold border-2 border-bg-surface shadow-sm overflow-hidden">
                        {log.user.avatar ? (
                          <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
                        ) : (
                          log.user.name?.[0] || '?'
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-surface flex items-center justify-center ${config.bgColor}`}>
                        {config.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-text-main leading-tight">
                          <span className="font-bold hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">{log.user.name || log.user.email}</span>
                          <span className="text-text-muted mx-1.5 font-medium">{config.label}</span>
                          {log.details?.target && (
                            <span className="font-bold text-text-main bg-bg-muted px-1.5 py-0.5 rounded text-[11px] border border-border-main">{log.details.target}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock size={10} className="text-text-muted" />
                          <span className="text-[10px] font-bold text-text-muted">{formatTime(log.timestamp)}</span>
                        </div>
                      </div>
                      
                      {log.details && (log.details.from || log.details.to || log.details.info) && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-1 h-full min-h-[12px] bg-border-main rounded-full"></div>
                          <div className="text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap">
                            {log.details.from && (
                              <span className="line-through opacity-60 italic">{log.details.from}</span>
                            )}
                            {log.details.from && log.details.to && <ArrowRight size={10} />}
                            {log.details.to && (
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded">{log.details.to}</span>
                            )}
                            {log.details.info && (
                              <span className="italic opacity-80">"{log.details.info}"</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
