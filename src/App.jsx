import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Kanban, 
  Clock, 
  User, 
  Bell, 
  Sun, 
  Moon, 
  Play, 
  Square,
  MoreVertical,
  Briefcase,
  Zap,
  Coffee,
  Copy,
  CheckCircle,
  Users,
  Database,
  Shield,
  MessageSquare,
  LogOut,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  Search,
  Info,
  Menu,
  X,
  Folder,
  Plus,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { API_BASE_URL, WS_URL } from './config';
import { useTeamPresence } from './hooks/useTeamPresence';
import socketService from './services/SocketService';
// Helper to handle lazy loading errors (e.g. when a new version is deployed and old chunks are gone)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Chunk load failed:", error);
      // If the error is about a missing module, it usually means a new deployment happened
      // and the browser is trying to load a chunk from a previous build.
      // Reloading the page will fetch the latest index.html and chunk manifests.
      if (error.message.includes("Failed to fetch dynamically imported module") || 
          error.message.includes("loading chunk")) {
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy-load all view components
const ProjectManager = lazyWithRetry(() => import('./components/ProjectManager'));
const TimeTracker = lazyWithRetry(() => import('./components/TimeTracker'));
const Vault = lazyWithRetry(() => import('./components/Vault'));
const Login = lazyWithRetry(() => import('./components/Login'));
const TeamTracker = lazyWithRetry(() => import('./components/TeamTracker'));
const CRM = lazyWithRetry(() => import('./components/CRM'));
const GodMode = lazyWithRetry(() => import('./components/GodMode'));
const NotificationCenter = lazyWithRetry(() => import('./components/NotificationCenter'));
const TicketManager = lazyWithRetry(() => import('./components/TicketManager'));
const ProjectManagement = lazyWithRetry(() => import('./components/ProjectManagement'));
const AnalyticsDashboard = lazyWithRetry(() => import('./components/AnalyticsDashboard'));
const Overview = lazyWithRetry(() => import('./components/Overview'));
const Logs = lazyWithRetry(() => import('./components/Logs'));
const CommandPalette = lazyWithRetry(() => import('./components/CommandPalette'));
const Attendance = lazyWithRetry(() => import('./components/Attendance'));
import { TEAM_MEMBERS } from './constants/users';
import { calculateDailyGoal } from './utils/taskMetrics';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
const kaironIcon = '/kairon-icon.png';

const STATUS_CONFIG = {
  available:  { label: 'AVAILABLE',  color: 'green',  icon: <CheckCircle size={14} /> },
  deep_work:  { label: 'DEEP WORK',  color: 'purple', icon: <Zap size={14} /> },
  in_meeting: { label: 'IN MEETING', color: 'amber',  icon: <Users size={14} /> },
  break:      { label: 'BREAK',      color: 'amber',  icon: <Coffee size={14} /> },
  away:       { label: 'AWAY',       color: 'gray',   icon: <Moon size={14} /> },
  offline:    { label: 'OFFLINE',    color: 'gray',   icon: <Moon size={14} /> },
  // legacy aliases kept for backward-compat with existing socket data
  focus:      { label: 'FOCUS',      color: 'green',  icon: <Zap size={14} /> },
  deepwork:   { label: 'DEEP WORK',  color: 'purple', icon: <Zap size={14} /> },
  zen:        { label: 'ZEN',        color: 'purple', icon: <Moon size={14} /> },
  standup:    { label: 'STANDUP',    color: 'green',  icon: <CheckCircle size={14} /> },
};


const getViewTitle = (view) => {
  const titles = {
    analytics: 'Overview',
    project: 'Sprint Plan',
    time: 'Time Tracker',
    tickets: 'Approval Tickets',
    vault: 'The Vault',
    team: 'Team Hub',
    crm: 'Client Hub (CRM)',
    godmode: 'God Mode',
    logs: 'Logs',
    attendance: 'Attendance'
  };
  return titles[view] || 'Dashboard';
};

const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 rounded-full border-2 border-[#4a154b]/30 border-t-[#4a154b] animate-spin" />
  </div>
);

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mkavs_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [hasInitializedStatus, setHasInitializedStatus] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('mkavs_admin_user', JSON.stringify(userData));
    localStorage.setItem('mkavs_staff_status', 'online');
    setHasInitializedStatus(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mkavs_admin_user');
    localStorage.removeItem('mkavs_staff_status');
    setHasInitializedStatus(false);
  };

  // Global 401 handler to clear session immediately when token is invalid
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('mkavs-unauthorized'));
      }
      return response;
    };

    const handleUnauthorized = () => {
      // Only log out if we actually have a user session to clear
      // This prevents interrupting the login process itself
      if (user) {
        console.warn("Unauthorized API call detected. Bypassing logout for now...");
        // handleLogout();
      }
    };
    
    window.addEventListener('mkavs-unauthorized', handleUnauthorized);
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('mkavs-unauthorized', handleUnauthorized);
    };
  }, []);


   const [activeView, setActiveView] = useState(() => localStorage.getItem('mkavs_admin_active_view') || 'analytics');
   const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
   const [isLiveOnChatbot, setIsLiveOnChatbot] = useState(() => {
     return localStorage.getItem('mkavs_kairon_live') === 'true';
   });
   
   const handleChatbotToggle = () => {
     const newState = !isLiveOnChatbot;
     const iframe = document.getElementById('kairon-iframe');
     if (iframe && iframe.contentWindow) {
         iframe.contentWindow.postMessage({ type: newState ? 'KAIRON_GO_ONLINE' : 'KAIRON_GO_OFFLINE' }, '*');
         // Also ensure theme is synced when going live
         iframe.contentWindow.postMessage({ type: 'SET_THEME', isDark: isDarkMode }, '*');
     }
     setIsLiveOnChatbot(newState);
     localStorage.setItem('mkavs_kairon_live', newState);
   };
  
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'KAIRON_IS_ONLINE') setIsLiveOnChatbot(true);
      if (e.data?.type === 'KAIRON_IS_OFFLINE') setIsLiveOnChatbot(false);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem('mkavs_admin_active_view', activeView);
  }, [activeView]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mkavs_theme');
    return saved === 'true' || saved === null;
  });
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenTime, setZenTime] = useState(25 * 60);
  const [standupCopied, setStandupCopied] = useState(false);
  const [specialMention, setSpecialMention] = useState(() => localStorage.getItem('mkavs_special_mention') || "The first 90% of code accounts for the first 90% of development time...");

  const handleSpecialMentionChange = (e) => {
    const val = e.target.value;
    setSpecialMention(val);
    localStorage.setItem('mkavs_special_mention', val);
  };

  // Use new team presence hook
  const { 
    presenceMap, 
    isSynced, 
    updateMyStatus: handleStatusChange,
    getMemberPresence
  } = useTeamPresence(user);

  // Derived current user status
  const currentStatus = useMemo(() => {
    if (!user) return 'offline';
    return getMemberPresence(user.email).status;
  }, [user, getMemberPresence]);

  // hasInitializedStatus is now managed at the top level

  useEffect(() => {
    if (user && !hasInitializedStatus) {
      const savedStatus = localStorage.getItem('mkavs_staff_status');
      if (!savedStatus || savedStatus === 'offline') {
        handleStatusChange('online');
      } else {
        handleStatusChange(savedStatus);
      }
      setHasInitializedStatus(true);
    }
  }, [user, handleStatusChange, hasInitializedStatus]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('mkavs_sidebar_collapsed');
    return saved === 'true' || saved === null;
  });

  useEffect(() => {
    localStorage.setItem('mkavs_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('lock-scroll');
    } else {
      document.body.classList.remove('lock-scroll');
    }
    return () => document.body.classList.remove('lock-scroll');
  }, [isMobileMenuOpen]);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [ticketStatsLoading, setTicketStatsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  // Attendance rate
  const [attendanceRate, setAttendanceRate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Initial Session Verification
  useEffect(() => {
    const verifySession = async () => {
      if (!user?.token) return;
      
      setIsValidating(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
          headers: { 'Authorization': `Bearer ${user.token.trim()}` }
        });
        
        if (!res.ok) {
          console.warn('[AUTH] Session verification failed, but bypassing logout');
          // setUser(null);
          // localStorage.removeItem('mkavs_admin_user');
        } else {
          const data = await res.json();
          // Keep current user but potentially update from server, preserving token
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...data.agent };
            localStorage.setItem('mkavs_admin_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn("Session verification failed (Server might be down). Staying in offline mode.", err);
      } finally {
        setIsValidating(false);
      }
    };

    verifySession();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects?t=${Date.now()}`, {
        headers: {
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Fetch projects failed:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      const interval = setInterval(fetchProjects, 60000); // 1m sync
      return () => clearInterval(interval);
    }
  }, [user]);

  const dailyStats = calculateDailyGoal(projects, user);

  // Real-time online count derived from socket presence map
  const onlineCount = useMemo(() =>
    TEAM_MEMBERS.filter(m => getMemberPresence(m.email).isOnline).length,
  [getMemberPresence]);
  
  // Apply dark mode and smooth transitions
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mkavs_theme', JSON.stringify(isDarkMode));
    
    // Add global transition class to body for smooth switching
    document.body.classList.add('transition-colors', 'duration-500');

    // Sync theme with Kairon iframe
    const iframe = document.getElementById('kairon-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'SET_THEME', isDark: isDarkMode }, '*');
    }
  }, [isDarkMode]);

  // Notifications sync
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const fetchNotifs = () => {
      const saved = localStorage.getItem('mkavs_notifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse notifications", e);
        }
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 2000);
    return () => clearInterval(interval);
  }, []);

  // Time Tracker State (Product Requirements: Separate session from total)
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedTodaySeconds, setCompletedTodaySeconds] = useState(0);
  const [completedMonthSeconds, setCompletedMonthSeconds] = useState(0);
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [activeSessionStartTime, setActiveSessionStartTime] = useState(null);
  const [firstLoginTime, setFirstLoginTime] = useState(null);
  const [isApprovedToday, setIsApprovedToday] = useState(false);
  
  // Helper: Format seconds to HH:MM:SS
  const formatDuration = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return '00:00:00';
    const absSeconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  // Sync attendance stats on mount
  useEffect(() => {
    if (!user?.token) return;

    const fetchCurrentStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attendance/stats`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompletedTodaySeconds(data.totalDurationToday || 0);
          setCompletedMonthSeconds(data.totalDurationMonth || 0);

          // Compute attendance rate from real monthly data
          if (typeof data.daysPresent === 'number' && data.workingDays > 0) {
            setAttendanceRate(Math.round((data.daysPresent / data.workingDays) * 100));
          } else {
            setAttendanceRate(null);
          }
          
          setIsApprovedToday(data.isPresent || false);

          if (data.clockInTime) {
            setFirstLoginTime(new Date(data.clockInTime));
          } else {
            setFirstLoginTime(null);
          }

          // Active session = currently clocked in
          if (data.presenceStatus === 'clocked-in' && data.sessionStartTime) {
            setTimerRunning(true);
            const start = new Date(data.sessionStartTime);
            if (!isNaN(start.getTime())) {
              setActiveSessionStartTime(start);
              setCurrentSessionSeconds(Math.floor((new Date() - start) / 1000));
            } else {
              setTimerRunning(false);
              setActiveSessionStartTime(null);
            }
          } else {
            setTimerRunning(false);
            setActiveSessionStartTime(null);
            setCurrentSessionSeconds(0);
          }
        }
      } catch (e) { console.error("Stats sync failed", e); }
    };

    fetchCurrentStats();
  }, [user]);

  // Ticker Logic (Derive from timestamps to prevent drift)
  useEffect(() => {
    let ticker;
    if (timerRunning && activeSessionStartTime && !isNaN(activeSessionStartTime.getTime())) {
      ticker = setInterval(() => {
        const now = new Date();
        const elapsed = Math.max(0, Math.floor((now - activeSessionStartTime) / 1000));
        setCurrentSessionSeconds(elapsed);
      }, 1000);
    } else {
      setCurrentSessionSeconds(0);
    }
    return () => clearInterval(ticker);
  }, [timerRunning, activeSessionStartTime]);

  const handleTimerToggle = async () => {
    if (!user?.token) return;
    
    try {
      const endpoint = timerRunning ? 'clock-out' : 'clock-in';
      const res = await fetch(`${API_BASE_URL}/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        if (!timerRunning) {
          // Clock In successful
          setTimerRunning(true);
          
          if (data.clockInTime) {
            setFirstLoginTime(new Date(data.clockInTime));
          }
          
          const start = new Date(data.sessionStartTime || data.clockInTime);
          if (!isNaN(start.getTime())) {
            setActiveSessionStartTime(start);
            setCurrentSessionSeconds(0);
          } else {
            setTimerRunning(false);
            alert('Clock-in failed: invalid time from server');
          }
        } else {
          // Clock Out successful
          setCompletedTodaySeconds(data.totalDuration || 0);
          setCompletedMonthSeconds(prev => prev + (data.sessionSeconds || 0));
          setTimerRunning(false);
          setActiveSessionStartTime(null);
          setCurrentSessionSeconds(0);
          window.dispatchEvent(new CustomEvent('mkavs-timer-stopped'));
        }
      } else {
        const errMsg = data.error || data.message || 'Clock operation failed';
        alert(`\u26a0\ufe0f ${errMsg}`);
      }
    } catch (e) { console.error('Clock toggle error', e); }
  };

  const generateStandup = () => {
    const text = `*Standup Update:*\n- Yesterday: Fixed Auth Bug (2 hrs), Completed Sprint Planning.\n- Today: Building Bento UI, Code Review for PR #42.\n- Blockers: None.`;
    navigator.clipboard.writeText(text);
    setStandupCopied(true);
    setTimeout(() => setStandupCopied(false), 2000);
  };

  useEffect(() => {
    let interval;
    if (isZenMode) {
      interval = setInterval(() => {
        setZenTime(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isZenMode]);

  const formatZenTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Note: isZenMode early return is handled after all hooks below


  const fetchTicketStats = async () => {
    try {
      if (user?.token) {
        console.log(`[DEBUG] Fetching ticket stats with token starting with: ${user.token.substring(0, 10)}...`);
      }
      const res = await fetch(`${API_BASE_URL}/api/tickets/stats`, {
        headers: {
          'Authorization': `Bearer ${user.token.trim()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketStats(data);
      }
    } catch (e) {
      console.warn("Failed to fetch ticket stats", e);
    } finally {
      setTicketStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      // Stagger ticket stats fetch 600ms to reduce mount-time request flood
      const t = setTimeout(fetchTicketStats, 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
  }, [user, currentStatus]);

  // handleStatusChange is now provided by usePresence hook

  // getStaffStatus is replaced by getMemberPresence from hook

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Zen Mode — safe to early-return here since all hooks have been called
  if (isZenMode) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 transition-colors duration-700 font-sans relative overflow-hidden text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-accent/10 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8">
          <div className="mb-12 flex items-center gap-4 text-zinc-400">
            <Zap size={24} className="text-accent" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-white">Deep Work Session</h2>
          </div>
          <div className="text-[8rem] font-black tracking-tighter tabular-nums leading-none mb-12 text-transparent bg-clip-text bg-gradient-to-b from-white to-accent/50">
            {formatZenTime(zenTime)}
          </div>
          <div className="w-full bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 border border-zinc-800 text-center mb-12">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Current Task</p>
            <p className="text-2xl font-semibold text-zinc-200">Building Bento UI components for Dashboard</p>
          </div>
          <button
            onClick={() => setIsZenMode(false)}
            className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all backdrop-blur-md border border-white/10"
          >
            Exit Zen Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-bg-root transition-colors duration-300 font-sans relative text-text-main">
      
      {/* Dynamic Sidebar */}
      <Sidebar 
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        isDarkMode={isDarkMode}
        isLiveOnChatbot={isLiveOnChatbot}
        handleLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-bg-surface relative overflow-hidden">
        {/* Top Header */}
        <AppHeader 
          user={user}
          activeView={activeView}
          getViewTitle={getViewTitle}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        />

        {/* View Header */}
        <div className="px-6 py-8 border-b border-border-main bg-bg-surface relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none"></div>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 flex items-center gap-5">
              <img src={user?.avatar || '/default-avatar.png'} className="w-16 h-16 rounded-full border border-border-main shadow-sm" alt="" />
              <div>
                <h1 className="text-2xl font-bold text-text-main tracking-tight leading-none mb-1">Good morning, {user?.firstName || 'Shawn'} 👋</h1>
                <p className="text-sm text-text-muted">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {user?.isExecutive ? 'Executive Workspace' : user?.isManager ? 'Manager Workspace' : 'Team Workspace'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsQuickLogOpen(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold border border-accent text-accent hover:bg-accent/10 transition-colors shadow-sm"
              >
                ⚡ Quick Log
              </button>
              {(user?.isExecutive || user?.isManager) && (
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-text-main text-bg-surface hover:opacity-90 transition-opacity shadow-sm"
                >
                  + New Project
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-bg-root scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>}>
              <AnimatePresence mode="wait">
                {activeView === 'analytics' && (
                  <motion.div 
                    key="analytics" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
                  >
                    {(user?.isExecutive || user?.isManager) ? (
                      <div className="lg:col-span-2">
                        <AnalyticsDashboard
                          projects={projects}
                          user={user}
                          onlineCount={onlineCount}
                          totalMembers={TEAM_MEMBERS.length}
                          attendanceRate={attendanceRate}
                          loading={projectsLoading}
                        />
                      </div>
                    ) : (
                      <div className="lg:col-span-2">
                        <Overview user={user} />
                      </div>
                    )}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Live Presence HERO */}
                      <div className="bg-bg-surface border border-border-main rounded-2xl shadow-md p-8 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg">
                        <div className="flex items-center gap-2 mb-6">
                          <div className={`w-2.5 h-2.5 rounded-full ${timerRunning ? 'bg-accent animate-pulse shadow-[0_0_8px_var(--theme-accent)]' : 'bg-text-muted'}`}></div>
                          <span className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em]">{timerRunning ? 'Live Presence Active' : 'Offline'}</span>
                        </div>
                        <div className="text-[54px] font-black tracking-tighter text-text-main leading-none mb-3 font-['JetBrains_Mono']">
                          {formatDuration(currentSessionSeconds || completedTodaySeconds)}
                        </div>
                        <div className="text-xs font-bold text-text-muted mb-8 uppercase tracking-widest">
                          {timerRunning
                            ? `First Login: ${firstLoginTime ? new Date(firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}`
                            : `Total Today: ${formatDuration(completedTodaySeconds)}`
                          }
                        </div>
                        
                        <div className="flex flex-col items-center justify-center gap-3 w-full">
                          {!timerRunning ? (
                            <button 
                              onClick={handleTimerToggle} 
                              disabled={!isApprovedToday && !user?.isExecutive}
                              className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 ${
                                !isApprovedToday && !user?.isExecutive
                                ? 'bg-bg-muted text-text-muted cursor-not-allowed border-2 border-border-main'
                                : 'bg-accent text-bg-root hover:opacity-90 hover:shadow-md'
                              }`}
                            >
                              Clock In
                            </button>
                          ) : (
                            <button onClick={handleTimerToggle} className="w-full py-3.5 rounded-xl border-2 border-border-main text-text-main font-black uppercase tracking-widest hover:bg-bg-muted transition-all flex justify-center items-center gap-2">
                              Clock Out
                            </button>
                          )}
                          {!timerRunning && !isApprovedToday && !user?.isExecutive && (
                            <div className="text-[10px] text-text-muted mt-1">Awaiting approval from Mr.K</div>
                          )}
                        </div>
                      </div>

                      {/* Profile Summary Card */}
                      <ProfileSummaryCard user={user} currentStatus={currentStatus} />
                      <YourStatus 
                        currentStatus={currentStatus} 
                        handleStatusChange={handleStatusChange} 
                        setIsZenMode={setIsZenMode}
                      />
                      <TeamStatus 
                        user={user} 
                        getMemberPresence={getMemberPresence} 
                      />
                      <RecentActivityFeed user={user} />
                    </div>
                  </motion.div>
                )}

                {activeView === 'project' && (
                  <motion.div key="project" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <ProjectManager
                      user={user}
                      projects={projects}
                      onRefresh={fetchProjects}
                      setProjects={setProjects}
                      externalOpen={isProjectModalOpen}
                      onExternalClose={() => setIsProjectModalOpen(false)}
                    />
                  </motion.div>
                )}

                {activeView === 'time' && (
                  <motion.div key="time" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <TimeTracker user={user} onTicketSubmit={fetchTicketStats} completedTodaySeconds={completedTodaySeconds} currentSessionSeconds={currentSessionSeconds} completedMonthSeconds={completedMonthSeconds} />
                  </motion.div>
                )}

                {activeView === 'tickets' && (
                  <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <TicketManager user={user} onReview={fetchTicketStats} />
                  </motion.div>
                )}


                {activeView === 'vault' && (
                  <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Vault />
                  </motion.div>
                )}

                <div className={activeView === 'kairon' ? "w-full h-[800px]" : "hidden"}>
                  <iframe 
                    id="kairon-iframe"
                    src="/neoncode/kairon-live-bot/live_staff.html"
                    className="w-full h-full border-0 rounded-2xl border border-border-main shadow-sm"
                    title="Kairon Live Staff Dashboard"
                    allow="autoplay; clipboard-write"
                  ></iframe>
                </div>

                {activeView === 'team' && (
                  <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <TeamTracker user={user} />
                  </motion.div>
                )}

                {activeView === 'logs' && (
                  <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Logs />
                  </motion.div>
                )}

                {activeView === 'crm' && user.isExecutive && (
                  <motion.div key="crm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <CRM user={user} />
                  </motion.div>
                )}

                {activeView === 'godmode' && user.isExecutive && (
                  <motion.div key="godmode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <GodMode />
                  </motion.div>
                )}

                {activeView === 'project_management' && (
                  <motion.div key="project_management" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-hidden">
                    <ProjectManagement user={user} />
                  </motion.div>
                )}

                {activeView === 'attendance' && (
                  <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Attendance user={user} />
                  </motion.div>
                )}

              </AnimatePresence>
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            onClose={() => setIsCommandPaletteOpen(false)}
            onAction={(actionId) => {
              if (['project', 'tickets', 'time', 'crm', 'vault', 'analytics'].includes(actionId)) {
                setActiveView(actionId);
              } else if (actionId === 'logout') {
                handleLogout();
              } else if (actionId === 'toggle_timer') {
                handleTimerToggle();
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Log Modal */}
      <AnimatePresence>
        {isQuickLogOpen && (
          <QuickLogModal user={user} projects={projects} onClose={() => setIsQuickLogOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}

function ProfileSummaryCard({ user, currentStatus }) {
  const isOnline = currentStatus !== 'offline';
  
  // Try to find the UID from the TEAM_MEMBERS if possible, else fallback
  const teamMember = TEAM_MEMBERS.find(m => m.email === user?.email);
  const uid = teamMember?.uid || user?.uid || (user?.isExecutive ? 'MGT-EXE-01' : 'MGT-DEV-01');
  
  return (
    <div className="bg-bg-surface border border-border-main rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0">
          <img 
            src={user?.avatar || '/default-avatar.png'} 
            alt={user?.name} 
            className="w-[72px] h-[72px] rounded-[1.25rem] object-cover shadow-sm border border-bg-muted"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-black text-text-main truncate leading-none mb-3 tracking-tight">
            {user?.name || 'Loading...'}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 bg-bg-muted text-text-muted rounded-md text-[11px] font-medium tracking-tight">
              @{user?.email?.split('@')[0] || 'username'}
            </span>
            <div className="w-1 h-1 rounded-full bg-[#d1d5da]"></div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[11px] font-bold tracking-wider font-mono">
              {uid}
            </span>
            <div className="w-1 h-1 rounded-full bg-[#d1d5da]"></div>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


function YourStatus({ currentStatus, handleStatusChange, setIsZenMode }) {
  const statuses = [
    { id: 'zen',   label: 'Zen Mode',       icon: '🧘' },
    { id: 'dnd',   label: 'Do not Disturb', icon: '⛔' },
    { id: 'break', label: 'Break',          icon: '☕' },
  ];

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl shadow-card p-5">
      <h3 className="text-base font-semibold text-text-main mb-4">Your Status</h3>
      <div className="grid grid-cols-3 gap-3">
        {statuses.map(stat => {
          const isActive = currentStatus === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => {
                if (isActive) {
                  // If clicking the active status again, revert to online
                  handleStatusChange('online');
                  if (stat.id === 'zen') setIsZenMode(false);
                } else {
                  // Activate the new status
                  handleStatusChange(stat.id);
                  if (stat.id === 'zen') setIsZenMode(true);
                  if (currentStatus === 'zen') setIsZenMode(false);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-[11px] font-bold transition-all border ${
                isActive 
                  ? 'border-accent bg-accent/10 text-accent' 
                  : 'bg-bg-surface border-border-main text-text-secondary hover:bg-bg-muted'
              }`}
            >
              <span className="text-lg">{stat.icon}</span>
              <span className="truncate text-center w-full">{stat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TeamMember({ name, role, status, isOnline, isSyncing, avatar, isMe }) {
  const STATUS_CONFIG = {
    online:     { label: 'Online',         color: 'text-success', dot: 'bg-success' },
    zen:        { label: 'Zen Mode',       color: 'text-secondary',  dot: 'bg-secondary' },
    dnd:        { label: 'Do not Disturb', color: 'text-danger',    dot: 'bg-danger' },
    break:      { label: 'Break',          color: 'text-warning',   dot: 'bg-warning' },
    offline:    { label: 'Offline',        color: 'text-text-muted',  dot: 'bg-text-muted' },
    available:  { label: 'Available',      color: 'text-success', dot: 'bg-success' },
    deep_work:  { label: 'Deep Work',      color: 'text-secondary',  dot: 'bg-secondary' },
    in_meeting: { label: 'In Meeting',     color: 'text-warning',   dot: 'bg-warning' },
    away:       { label: 'Away',           color: 'text-text-muted',  dot: 'bg-text-muted' },
    focus:      { label: 'Focus',          color: 'text-success', dot: 'bg-success' },
    deepwork:   { label: 'Deep Work',      color: 'text-secondary',  dot: 'bg-secondary' },
    standup:    { label: 'Standup',        color: 'text-success', dot: 'bg-success' },
  };

  const config = isSyncing 
    ? { label: 'Syncing...', color: 'text-text-muted', dot: 'bg-text-muted animate-pulse' }
    : (STATUS_CONFIG[status] || STATUS_CONFIG.offline);

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <div className="flex items-center justify-between py-3.5 group">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shadow-sm border-[2px] border-border-main/50" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-bg-surface bg-text-main flex-shrink-0 shadow-sm border-[2px] border-border-main/50">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h4 className="text-[13px] font-bold text-text-main truncate leading-tight">
            {name} {isMe && <span className="text-text-muted font-normal">(You)</span>}
          </h4>
          <p className="text-[11px] font-semibold text-text-muted truncate mt-0.5">{role}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-bg-root px-2.5 py-1.5 rounded-lg border border-border-main/50">
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
        <span className={`text-[10px] font-bold tracking-wide ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

function TeamStatus({ user, getMemberPresence }) {
  const members = TEAM_MEMBERS.map(member => {
    const presence = getMemberPresence(member.email);
    return {
      email: member.email,
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      status: presence.status || 'offline',
      isOnline: presence.isOnline || false,
    };
  });

  const onlineCount = members.filter(m => m.isOnline).length;

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-main">Team Hub</h3>
        <span className="text-[10px] font-bold bg-accent/10 text-accent px-2.5 py-1 rounded-md border border-accent/20">
          {onlineCount}/{members.length} Online
        </span>
      </div>
      <div className="divide-y divide-border-main/50">
        {members.map(member => (
          <TeamMember 
            key={member.name}
            name={member.name}
            role={member.role}
            avatar={member.avatar}
            status={member.status}
            isOnline={member.isOnline}
            isMe={member.email === user?.email}
          />
        ))}
      </div>
    </div>
  );
}

function RecentActivityFeed({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setActivities(await res.json());
    } catch (e) { console.error('Activity feed fetch failed', e); }
    finally { setLoading(false); }
  }, [user?.token]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const formatTime = (ts) => {
    const date = new Date(ts);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getConfig = (type) => {
    switch (type) {
      case 'CLOCK_IN':  return { color: 'bg-success', label: 'clocked in' };
      case 'CLOCK_OUT': return { color: 'bg-zinc-500',    label: 'clocked out' };
      case 'WORK_LOG':  return { color: 'bg-accent',      label: 'logged work' };
      default:          return { color: 'bg-zinc-400',    label: type.toLowerCase().replace('_', ' ') };
    }
  };

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl shadow-card p-5">
      <h3 className="text-base font-semibold text-text-main mb-5">Recent Activity</h3>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-start gap-3.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-bg-muted rounded w-4/5" />
                <div className="h-2 bg-bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-xs font-bold text-text-muted">No activity yet today.</p>
          <p className="text-[10px] text-text-muted mt-1 opacity-60">Clock in or log your first task.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 6).map(act => {
            const cfg = getConfig(act.type);
            return (
              <div key={act.id} className="flex items-start gap-3.5">
                <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center text-[11px] font-black flex-shrink-0 shadow-sm overflow-hidden text-white`}>
                  {act.user?.avatar
                    ? <img src={act.user.avatar} alt={act.user?.name} className="w-full h-full object-cover" />
                    : act.user?.name?.[0] || '?'}
                </div>
                <div className="pt-0.5 min-w-0 flex-1">
                  <p className="text-[13px] text-text-main leading-snug">
                    <span className="font-bold">{act.user?.name || 'Unknown'}</span>
                    {' '}<span className="text-text-muted">{cfg.label}</span>
                    {act.project && <span className="font-semibold text-text-main"> · {act.project.name}</span>}
                  </p>
                  {act.description && act.type === 'WORK_LOG' && (
                    <p className="text-[11px] text-text-muted mt-0.5 truncate italic">"{act.description}"</p>
                  )}
                  <p className="text-[10px] font-semibold text-text-muted mt-1">{formatTime(act.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickLogModal({ user, projects, onClose }) {
  const [form, setForm] = useState({ description: '', projectId: '', minutes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/worklogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ description: form.description, projectId: form.projectId || null, minutes: parseInt(form.minutes, 10) })
      });
      if (res.ok) {
        setDone(true);
        setTimeout(onClose, 1600);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save. Try again.');
      }
    } catch { setError('Connection error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-bg-root/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-bg-surface rounded-2xl border border-border-main shadow-2xl p-8 z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black tracking-tight text-text-main">⚡ Quick Log</h3>
          <button onClick={onClose} className="p-2 rounded-lg bg-bg-muted text-text-muted hover:text-text-main transition-colors"><X size={18} /></button>
        </div>
        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-success-tint rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-success" />
            </div>
            <p className="font-black text-text-main text-lg">Logged!</p>
            <p className="text-xs text-text-muted mt-1">Your work has been saved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">What did you work on?</label>
              <textarea
                rows={3} required
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="e.g. Fixed auth bug, updated dashboard layout..."
                className="w-full px-4 py-3 rounded-xl bg-bg-root border border-border-main text-sm text-text-main focus:outline-none focus:border-accent transition-all placeholder:text-text-muted/40 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Project</label>
                <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}
                  className="w-full px-3 py-3 rounded-xl bg-bg-root border border-border-main text-sm text-text-main focus:outline-none focus:border-accent">
                  <option value="">— None —</option>
                  {projects.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Time (minutes)</label>
                <input type="number" required min={1} max={480}
                  value={form.minutes}
                  onChange={e => setForm({...form, minutes: e.target.value})}
                  placeholder="30"
                  className="w-full px-4 py-3 rounded-xl bg-bg-root border border-border-main text-sm text-text-main focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            {error && <p className="text-rose-500 text-xs font-semibold">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-bg-root font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-sm">
              {loading ? 'Saving...' : '⚡ Log Work'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function LogsView() {
  const logs = [
    { id: 1, type: 'info', msg: 'System integrity check completed.', time: '2 mins ago' },
    { id: 2, type: 'auth', msg: 'Admin login detected: Krishawn Rahul', time: '15 mins ago' },
    { id: 3, type: 'db', msg: 'Database sync: 14 projects updated.', time: '1 hour ago' },
    { id: 4, type: 'bot', msg: 'Kairon Live Bot: Session initiated.', time: '2 hours ago' },
    { id: 5, type: 'error', msg: 'Failed to fetch external API: /v1/metrics', time: '3 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black tracking-tight">System Logs</h3>
        <button className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline">Clear Logs</button>
      </div>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-bg-root border border-border-main rounded-xl group hover:border-[#1a1a1b] transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${log.type === 'error' ? 'bg-danger' : log.type === 'auth' ? 'bg-secondary' : 'bg-success'}`}></div>
              <div>
                <p className="text-sm font-bold">{log.msg}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{log.type}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-text-muted">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
