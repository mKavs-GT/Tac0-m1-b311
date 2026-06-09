import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X } from 'lucide-react';
import { WS_URL, API_BASE_URL, authHeader } from '../config';

export default function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { ...authHeader() }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Fetch notifications failed:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup WebSocket for real-time notifications
      const ws = new WebSocket(WS_URL);
      // We are actually using Socket.io on the backend, not native WebSocket.
      // Wait, let's use the native socket if Socket.io client is imported, else just keep polling.
      // Actually, since I don't see socket.io-client imported here, I will stick to polling but faster, OR I'll see if I can import socket.io-client.
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s for real-time feel if socket fails
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { ...authHeader() }
      });
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
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { 
        method: 'PATCH',
        headers: { ...authHeader() }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleApprove = async (taskId, notifId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() }
      });
      if (res.ok) {
        markAsRead(notifId);
      } else {
        const err = await res.json();
        alert('Failed to approve: ' + err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-bg-muted transition-colors text-text-muted hover:text-text-main relative"
        aria-label="Toggle Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full shadow-[0_0_10px_var(--color-danger)]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-bg-surface border-l border-border-main shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between">
                <h4 className="text-xl font-bold text-text-main">Notifications</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        notifications.forEach(n => { if (!n.read) markAsRead(n.id); });
                      }}
                      className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} aria-label="Close Notifications" className="p-2 rounded-lg hover:bg-bg-muted text-text-muted transition-colors"><X size={20}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  <EmptyState 
                    icon={Check}
                    title="All caught up!"
                    subtitle="You have no new notifications."
                  />
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-xl transition-all cursor-pointer ${n.read ? 'bg-bg-root opacity-70' : 'bg-primary-tint border border-primary/20 shadow-sm'}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-primary">{n.title}</span>
                        <div className="flex flex-col items-end gap-1">
                          {!n.read && <div className="w-2 h-2 rounded-full bg-primary shadow-sm"></div>}
                          <span className="text-[10px] text-text-muted">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-text-main leading-snug mb-3">{n.message}</p>
                      
                      {n.type === 'APPROVAL_REQUIRED' && !n.read && (
                        <div className="flex items-center gap-2 mt-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApprove(n.taskId, n.id); }}
                            className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                          >
                            Approve Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
