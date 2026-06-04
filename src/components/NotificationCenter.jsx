import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects/notifications/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Fetch notifications failed:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin-projects/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Notifications"
        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-xs">Notifications</h4>
                <button onClick={() => setIsOpen(false)} aria-label="Close Notifications" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14}/></button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Check size={32} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-2" />
                    <p className="text-xs font-bold text-zinc-400">All caught up!</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={`p-3 rounded-xl transition-all ${n.read ? 'opacity-60' : 'bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10'}`}
                      onClick={() => !n.read && markAsRead(n._id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{n.title}</span>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>}
                      </div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight mb-2">{n.message}</p>
                      <div className="flex items-center gap-1 text-[8px] font-black text-zinc-400 uppercase">
                        <Clock size={10} />
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
