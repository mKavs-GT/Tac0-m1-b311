import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Mail, Phone, Building2, MapPin, Briefcase, Calendar as CalendarIcon, BarChart2, Tag, Paperclip, MessageSquare, CreditCard, Layers, RefreshCw, ChevronRight, ChevronLeft, Loader2, AlertCircle, Folder, ExternalLink, CheckCircle2, Clock, X, Upload, Trash2, Plus, FileText, Download, ChevronDown, Smartphone, Wallet, Send, Sparkles } from 'lucide-react';
import { DeliveryScheduler } from './ui/delivery-scheduler.jsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';
import palettesData from '../data/palettes.js';
import fontsData from '../data/fonts.js';
import ReactorKnob from './ui/control-knob.jsx';


const STATUS_COLORS = {
  Assigned: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Progress: 'bg-purple-50 text-purple-600 border-purple-100',
  'On Hold': 'bg-amber-50 text-amber-600 border-amber-100',
  Completed: 'bg-sky-50 text-sky-600 border-sky-100',
  Unassigned: 'bg-zinc-50 text-zinc-400 border-zinc-100',
};

function Avatar({ src, name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['from-accent-500 to-brand-purple-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  if (src) return <img src={src.startsWith('http') ? src : `${API_BASE_URL}${src}`} alt={name} className={`${sz} rounded-2xl object-cover ring-2 ring-white shadow-sm`} />;
  return <div className={`${sz} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm`}>{initials}</div>;
}

function Badge({ status }) {
  return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.Unassigned}`}>{status}</span>;
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden mt-2">
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#e1e4e8]/60 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[#f3f4f6] border border-[#e1e4e8] flex items-center justify-center flex-shrink-0"><Icon size={13} className="text-[#6a737d]" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#6a737d] uppercase tracking-widest">{label}</p>
        <p className="text-sm font-medium text-[#1a1a1b] truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const TABS = ['Overview', 'Project', 'Schedule', 'Billing', 'Messages', 'Assets'];

export default function ProjectManagement({ user }) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [search, setSearch] = useState('');

  const updateClientLocally = (email, updater) => {
    setClients(prev => prev.map(c => c.email === email ? updater(c) : c));
    setSelected(prev => prev?.email === email ? updater(prev) : prev);
  };

  const authHeader = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [uRes, pRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { credentials: 'include', headers: authHeader }),
        fetch(`${API_BASE_URL}/api/projects`, { credentials: 'include', headers: authHeader }),
      ]);
      const usersData = await uRes.json();
      const projectsData = await pRes.json();
      
      if (!uRes.ok) throw new Error(usersData.error || 'Failed to load users');
      if (!pRes.ok) throw new Error(projectsData.error || 'Failed to load projects');
      
      const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
      const proj = projectsData.projects || [];
      
      const assigned = users.filter(u => ['Assigned', 'Active', 'Completed'].includes(u.adminData?.projectStatus));
      setClients(assigned);
      setProjects(proj);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getProject = (client) => projects.find(p => p.userId === client._id || p.userId?._id === client._id);

  const filtered = clients.filter(c => {
    const name = (c.displayName || c.username || '').toLowerCase();
    return name.includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-0 h-full rounded-2xl overflow-hidden border border-[#e1e4e8] bg-white shadow-sm">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e4e8] bg-[#f9f9fb] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#1a1a1b] leading-none">Project Management</h2>
            <p className="text-[11px] text-[#6a737d] mt-0.5">
              {loading ? 'Loading…' : `${clients.length} active client${clients.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#6a737d] hover:text-[#1a1a1b] border border-[#e1e4e8] hover:border-[#d1d5da] bg-white transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-zinc-700" /></div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3"><AlertCircle size={24} className="text-rose-500/70" /><p className="text-sm text-zinc-500">{error}</p></div>
      ) : (
        <div className="flex flex-1 min-h-0">

          {/* Left Sidebar */}
          <div className={`group/sidebar relative flex-shrink-0 flex flex-col border-r border-[#e1e4e8] bg-[#f9f9fb] transition-[width] duration-300 ease-in-out overflow-hidden ${
            selected ? 'w-[60px] hover:w-[280px]' : 'w-[280px]'
          }`}>

            {/* Search row */}
            <div className="flex-shrink-0 border-b border-[#e1e4e8]/60" style={{ height: '52px' }}>
              {/* Collapsed: centered icon */}
              <div className={`absolute inset-x-0 flex items-center justify-center transition-opacity duration-200 ${selected ? 'opacity-100 group-hover/sidebar:opacity-0' : 'opacity-0 pointer-events-none'}`} style={{ height: '52px' }}>
                <Users size={16} className="text-[#6a737d]" />
              </div>
              {/* Expanded: full search input */}
              <div className={`px-3 py-3 transition-opacity duration-200 ${selected ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                <div className="relative">
                  <Users size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a737d] pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search clients…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white border border-[#e1e4e8] text-[13px] text-[#1a1a1b] placeholder-[#959da5] focus:outline-none focus:border-indigo-300 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Client list */}
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-700 gap-2">
                  <Folder size={18} />
                  <p className={`text-[10px] font-medium uppercase tracking-widest whitespace-nowrap transition-opacity duration-200 ${selected ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>No clients</p>
                </div>
              )}
              {/* Collapsed: icon strip */}
              <div className={`flex flex-col gap-1.5 p-2 transition-opacity duration-150 ${selected ? 'opacity-100 group-hover/sidebar:opacity-0 absolute inset-x-0' : 'opacity-0 hidden'}`}>
                {filtered.map(client => {
                  const isActive = selected?._id === client._id;
                  return (
                    <button key={client._id + '-icon'}
                      onClick={() => { setSelected(isActive ? null : client); setActiveTab('Overview'); }}
                      title={client.displayName || client.username}
                      className={`flex items-center justify-center w-full py-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50' : 'hover:bg-white hover:shadow-sm'}`}>
                      <div className="relative">
                        <Avatar src={client.image} name={client.displayName || client.username} size="sm" />
                        {isActive && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Expanded: full cards */}
              <div className={`flex flex-col gap-1.5 p-2 transition-opacity duration-200 ${selected ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                {filtered.map((client, index) => {
                  const proj = getProject(client);
                  const progress = proj?.adminData?.projectProgress || 0;
                  const isActive = selected?._id === client._id;
                  const status = client.adminData?.projectStatus || 'Assigned';
                  return (
                    <motion.button key={client._id}
                      onClick={() => { setSelected(isActive ? null : client); setActiveTab('Overview'); }}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      title={client.displayName || client.username}
                      className={`w-full text-left rounded-xl border transition-all duration-200 group/row relative overflow-hidden ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-white hover:border-[#e1e4e8] hover:shadow-sm'
                      }`}>
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r-full" />
                      )}
                      {/* Hover shimmer */}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
                      )}
                      <div className="flex items-center gap-3 px-3 py-3 pl-4">
                        {/* Avatar with progress ring */}
                        <div className="relative flex-shrink-0">
                          <svg className="absolute -inset-1 rotate-[-90deg]" width="44" height="44" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="2"
                              className={isActive ? 'text-accent-500/20' : 'text-zinc-800/60'} />
                            <motion.circle cx="22" cy="22" r="19" fill="none"
                              stroke="url(#pg)"
                              strokeWidth="2" strokeLinecap="round"
                              strokeDasharray={119}
                              initial={{ strokeDashoffset: 119 }}
                              animate={{ strokeDashoffset: 119 - (progress / 100) * 119 }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                            <defs>
                              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <Avatar src={client.image} name={client.displayName || client.username} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <p className={`font-semibold text-[13px] truncate transition-colors ${isActive ? 'text-[#1a1a1b]' : 'text-[#6a737d] group-hover/row:text-[#1a1a1b]'}`}>
                              {client.displayName || client.username || 'Unknown'}
                            </p>
                            <Badge status={status} />
                          </div>
                          <p className={`text-[11px] truncate transition-colors ${isActive ? 'text-[#6a737d]' : 'text-[#959da5] group-hover/row:text-[#6a737d]'}`}>{client.email}</p>
                          {proj && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-[3px] bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-brand-purple-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-600 flex-shrink-0">{progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-zinc-800/40 relative" style={{ height: '40px' }}>
              {/* Collapsed: centered dot */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${selected ? 'opacity-100 group-hover/sidebar:opacity-0' : 'opacity-0'}`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              {/* Expanded: stat */}
              <div className={`absolute inset-0 flex items-center px-4 gap-2 transition-opacity duration-200 ${selected ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <p className="text-[11px] text-zinc-600 whitespace-nowrap">
                  {clients.filter(c => c.adminData?.projectStatus === 'Active').length} active projects
                </p>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center">
                    <Users size={22} className="text-zinc-700" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-zinc-500">Select a client</p>
                    <p className="text-[11px] text-zinc-700 mt-1">Choose a client from the sidebar to open their workspace</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={selected._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                  {/* Client header */}
                  <div className="flex-shrink-0 bg-zinc-900/30 border-b border-zinc-800/50">
                    {/* Dynamic progress strip */}
                    {(() => {
                        const proj = getProject(selected);
                        const progress = proj?.adminData?.projectProgress || 0;
                        const color = progress >= 80 ? 'from-emerald-500 to-emerald-400'
                          : progress >= 50 ? 'from-indigo-500 via-purple-500 to-indigo-600'
                          : progress >= 20 ? 'from-amber-500 to-amber-400'
                          : 'from-zinc-400 to-zinc-300';
                      return (
                        <div className="relative h-[3px] w-full bg-zinc-800/80">
                          <motion.div
                            className={`absolute left-0 top-0 h-full rounded-r-full bg-gradient-to-r ${color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(progress, 2)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                          {/* Glow effect */}
                          <motion.div
                            className={`absolute top-0 h-full w-12 blur-sm bg-gradient-to-r ${color} opacity-60`}
                            initial={{ left: 0 }}
                            animate={{ left: `calc(${Math.max(progress, 2)}% - 48px)` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                          {/* Progress label */}
                          {progress > 0 && (
                            <motion.div
                              className="absolute right-3 -top-5 text-[10px] font-bold text-zinc-500"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                              {progress}% complete
                            </motion.div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="px-6 pt-4 pb-0">
                      {/* Top row: avatar + info + actions */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <Avatar src={selected.image} name={selected.displayName || selected.username} size="lg" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex-shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[16px] font-bold text-[#1a1a1b] leading-tight truncate">{selected.displayName || selected.username}</h3>
                              <p className="text-[12px] text-[#6a737d] mt-0.5 truncate">
                                {[selected.jobTitle, selected.company].filter(Boolean).join('  ·  ') || 'No job title'}
                              </p>
                              <p className="text-[11px] text-[#959da5] mt-0.5 truncate">{selected.email}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                              <Badge status={selected.adminData?.projectStatus || 'Assigned'} />
                              <button onClick={() => setSelected(null)}
                                className="w-7 h-7 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all flex items-center justify-center">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabs — underline style */}
                      <div className="flex gap-0 border-b border-zinc-800/0">
                        {TABS.map(t => (
                          <button key={t} onClick={() => setActiveTab(t)}
                            className={`relative px-4 py-2.5 text-[12px] font-semibold transition-all ${
                              activeTab === t ? 'text-[#1a1a1b]' : 'text-[#6a737d] hover:text-[#1a1a1b]'
                            }`}>
                            {t}
                            {activeTab === t && (
                              <motion.div layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 hide-scrollbar">
                    <AnimatePresence mode="wait">
                      {activeTab === 'Overview' && <OverviewTab key="o" client={selected} project={getProject(selected)} authHeader={authHeader} onUpdate={updateClientLocally} />}
                      {activeTab === 'Project' && <ProjectTab key="p" client={selected} project={getProject(selected)} authHeader={authHeader} onUpdate={updateClientLocally} />}
                      {activeTab === 'Schedule' && <ScheduleTab key="s" client={selected} authHeader={authHeader} onUpdate={updateClientLocally} />}
                      {activeTab === 'Billing' && <BillingTab key="b" client={selected} authHeader={authHeader} onUpdate={updateClientLocally} />}
                      {activeTab === 'Messages' && <MessagesTab key="m" client={selected} authHeader={authHeader} onUpdate={updateClientLocally} />}
                      {activeTab === 'Assets' && <AssetsTab key="a" client={selected} authHeader={authHeader} onUpdate={updateClientLocally} />}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}

function TabPanel({ children }) {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">{children}</motion.div>;
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-[#f9f9fb] rounded-2xl p-5 border border-[#e1e4e8] shadow-sm">
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e1e4e8]">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"><Icon size={11} className="text-indigo-500" /></div>
          <p className="text-xs font-bold text-[#1a1a1b] uppercase tracking-wider">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

function TimelineDisplay({ startDate, endDate, client, authHeader, onUpdate, editable = false }) {
  const [date, setDate] = useState({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined
  });
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Sync state if props change externally
  useEffect(() => {
    setDate({
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined
    });
  }, [startDate, endDate]);

  const handleSave = async () => {
    if (!client || !authHeader || !onUpdate) return;
    setUpdating(true);
    
    const formattedStart = date?.from ? format(date.from, "MMM d, yyyy") : "";
    const formattedEnd = date?.to ? format(date.to, "MMM d, yyyy") : "";

    // Only send the date fields — do NOT spread full adminData
    // to avoid overwriting other fields like projectProgress with stale values
    const patch = {
      projectStartDate: formattedStart,
      projectEndDate: formattedEnd
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: patch })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, ...patch } }));
        setOpen(false);
      }
    } catch (err) {
      console.error('Failed to update timeline dates:', err);
    } finally {
      setUpdating(false);
    }
  };

  const Content = (
    <div className={`flex items-center gap-3 w-full ${editable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
      <div className="flex-1 p-3 rounded-xl bg-white border border-[#e1e4e8] flex items-center gap-3 relative overflow-hidden group shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CalendarIcon size={14} className="text-emerald-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#6a737d] font-bold uppercase tracking-widest mb-0.5">Start Date</span>
          <span className="text-xs font-medium text-[#1a1a1b] truncate">{startDate || "Not specified"}</span>
        </div>
      </div>
      <div className="w-4 h-[1px] bg-[#e1e4e8] flex-shrink-0" />
      <div className="flex-1 p-3 rounded-xl bg-white border border-[#e1e4e8] flex items-center gap-3 relative overflow-hidden group shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
          <CalendarIcon size={14} className="text-rose-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-[#6a737d] font-bold uppercase tracking-widest mb-0.5">End Date</span>
          <span className="text-xs font-medium text-[#1a1a1b] truncate">{endDate || "Not specified"}</span>
        </div>
      </div>
    </div>
  );

  if (!editable) {
    return Content;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {Content}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-950" align="start">
        <div className="p-3">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800/50">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={updating} className="min-w-[100px]">
              {updating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save Timeline"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OverviewTab({ client, project, authHeader, onUpdate }) {
  const ad = { ...(project?.adminData || {}), ...(client?.adminData || {}) };
  return (
    <TabPanel>
      <Section title="Contact Information" icon={Mail}>
        <InfoRow icon={Mail} label="Email" value={client.email} />
        <InfoRow icon={Phone} label="Phone" value={client.phone} />
        <InfoRow icon={Building2} label="Company" value={client.company} />
        <InfoRow icon={Briefcase} label="Job Title" value={client.jobTitle} />
        <InfoRow icon={MapPin} label="Country" value={client.country} />
      </Section>
      
      <Section title="Project Timeline" icon={CalendarIcon}>
        <TimelineDisplay startDate={ad.projectStartDate} endDate={ad.projectEndDate} client={client} authHeader={authHeader} onUpdate={onUpdate} />
      </Section>
      {(ad.deliverables?.length > 0) && (
        <Section title="Deliverables" icon={Paperclip}>
          <div className="flex flex-col gap-2">
            {ad.deliverables.map((d, i) => {
              let downloadLink = d.link;
              if (d.link?.includes('/uploads/')) {
                const path = d.link.includes('://') ? new URL(d.link).pathname : d.link;
                downloadLink = `${API_BASE_URL}/api/download?file=${encodeURIComponent(path)}`;
              } else if (d.link && !d.link.includes('://') && !d.link.startsWith('/') && !d.link.startsWith('#')) {
                if (d.link.endsWith('.pdf') || d.link.endsWith('.png') || d.link.startsWith('client-')) {
                   downloadLink = `/uploads/${d.link}`;
                } else {
                   downloadLink = `https://${d.link}`;
                }
              }

              return (
              <a key={i} href={downloadLink} target="_blank" rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-accent-500/40 transition-all group">
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{d.title}</span>
                <ExternalLink size={13} className="text-zinc-600 group-hover:text-accent-400 transition-colors" />
              </a>
              );
            })}
          </div>
        </Section>
      )}
      {client.consultations?.length > 0 && (
        <Section title="Consultation History" icon={MessageSquare}>
          <div className="flex flex-col gap-3">
            {client.consultations.map((c, i) => (
              <div key={i} className="group p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-accent-500/30 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-500 to-brand-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-accent-500/10 text-accent-400 text-[10px] font-black uppercase tracking-widest border border-accent-500/20">
                      {c.plan || c.tier || 'General Inquiry'}
                    </span>
                    {c.connectPreference && (
                      <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-zinc-700/50">
                        Prefers: {c.connectPreference}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50">
                    <CalendarIcon size={12} className="text-accent-400" />
                    {(c.timestamp || c.date) ? new Date(c.timestamp || c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
                  </span>
                </div>

                <div className="mb-3 p-3 rounded-xl bg-white border border-[#e1e4e8] shadow-sm">
                  <p className="text-sm text-[#1a1a1b] leading-relaxed whitespace-pre-wrap">
                    {c.projectInfo || c.description || c.message || 'No project information provided.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-1 pt-3 border-t border-zinc-800/50">
                  {c.name && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <User size={13} className="text-zinc-500" />
                      {c.name}
                    </div>
                  )}
                  {(c.email || client.email) && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <Mail size={13} className="text-rose-400" />
                      {c.email || client.email}
                    </div>
                  )}
                  {(c.phone || client.phone) && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <Phone size={13} className="text-emerald-500/80" />
                      {c.phone || client.phone}
                    </div>
                  )}
                  {c.discord && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <MessageSquare size={13} className="text-[#5865F2]" />
                      {c.discord}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </TabPanel>
  );
}

function ProjectTab({ client, project, authHeader, onUpdate }) {
  // Merge project and client adminData — client.adminData is always up-to-date
  // because onUpdate patches it directly, while project may be stale from initial fetch.
  const ad = { ...(project?.adminData || {}), ...(client?.adminData || {}) };
  const progress = ad.projectProgress || 0;
  const [updating, setUpdating] = useState(false);

  const handleProgressSave = async (newProgress) => {
    setUpdating(true);
    try {
      // Only send the fields being changed — do NOT spread ad here,
      // as ad may contain stale empty-string dates from the project document
      // that would overwrite values already saved on the User document.
      const patch = { projectProgress: newProgress };
      if (newProgress === 100) {
        patch.projectStatus = 'Completed';
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: patch })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, ...patch } }));
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!project) return (
    <TabPanel><div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-3"><Folder size={36} /><p className="text-sm">No project workspace yet.</p></div></TabPanel>
  );

  return (
    <TabPanel>
        <div className="flex flex-col gap-5">
          <ReactorKnob 
            initialValue={progress} 
            loading={updating}
            onSave={handleProgressSave} 
          />

          <Section title="Status & Timeline" icon={Tag}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${STATUS_COLORS[ad.projectStatus] || STATUS_COLORS.Active}`}>
                  {ad.projectStatus || 'Active'}
                </span>
              </div>
              <TimelineDisplay startDate={ad.projectStartDate} endDate={ad.projectEndDate} client={client} authHeader={authHeader} onUpdate={onUpdate} editable={true} />
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          {ad.projectDescription && (
            <Section title="Project Scope" icon={Briefcase}>
              <p className="text-sm text-zinc-400 leading-relaxed italic border-l-2 border-zinc-800 pl-4 py-1">
                "{ad.projectDescription}"
              </p>
            </Section>
          )}

          {ad.projectTags?.length > 0 && (
            <Section title="Classification" icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {ad.projectTags.map(t => (
                  <span key={t} className="text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>

      {ad.tasks?.length > 0 && (
        <div className="mt-5">
          <Section title="Key Milestones" icon={CheckCircle2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ad.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 group/task hover:border-zinc-700 transition-all">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : t.status === 'In Progress' ? 'bg-accent-500 animate-pulse' : 'bg-zinc-700'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate font-medium">{t.task}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{t.dueDate || 'No date set'}</p>
                  </div>
                  <div className="opacity-0 group-hover/task:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </TabPanel>
  );
}

function ScheduleTab({ client, authHeader, onUpdate }) {
  const meetings = client.adminData?.meetings || [];
  const upcoming = meetings.filter(m => m.status === 'Upcoming');
  const past = meetings.filter(m => m.status !== 'Upcoming');

  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', link: '' });

  const saveMeetings = async (newMeetings) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { meetings: newMeetings } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, meetings: newMeetings } }));
        setIsAdding(false);
        setForm({ title: '', date: '', time: '', link: '' });
      }
    } catch (err) {
      console.error('Failed to save meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    saveMeetings([{ ...form, status: 'Upcoming' }, ...meetings]);
  };

  const handleDelete = (index) => {
    const updated = [...meetings];
    updated.splice(index, 1);
    saveMeetings(updated);
  };

  const handleStatus = (index, newStatus) => {
    const updated = [...meetings];
    updated[index].status = newStatus;
    saveMeetings(updated);
  };

  // Helper to find original index of a meeting in the full array
  const getOriginalIndex = (meeting) => meetings.indexOf(meeting);
  const [editingResources, setEditingResources] = useState(null); // originalIndex
  const [resourceForm, setResourceForm] = useState({ recordingLink: '', notes: '', documents: [] });
  const [uploadingMeetingDoc, setUploadingMeetingDoc] = useState(false);
  const meetingFileRef = useRef(null);

  const handleOpenResources = (index) => {
    const m = meetings[index];
    const assets = client.adminData?.meetingAssets || {};
    
    // Find recording and notes for this specific meeting
    const recording = (assets.recordings || []).find(r => r.meetingTitle === m.title && r.meetingDate === m.date);
    const note = (assets.notes || []).find(n => n.meetingTitle === m.title && n.meetingDate === m.date);
    const docs = (assets.documents || []).filter(d => d.meetingTitle === m.title && d.meetingDate === m.date);

    setEditingResources(index);
    setResourceForm({
      recordingLink: recording?.link || '',
      notes: note?.content || '',
      documents: docs || []
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMeetingDoc(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('meetingTitle', meetings[editingResources].title);
    fd.append('meetingDate', meetings[editingResources].date);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/meeting-upload`, {
        method: 'POST',
        headers: authHeader,
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.document) {
        setResourceForm(prev => ({
          ...prev,
          documents: [...prev.documents, data.document]
        }));
        
        // Update local client state immediately for the assets
        onUpdate(client.email, c => {
          const currentAssets = c.adminData?.meetingAssets || { recordings: [], documents: [], notes: [] };
          return {
            ...c,
            adminData: {
              ...c.adminData,
              meetingAssets: {
                ...currentAssets,
                documents: [...(currentAssets.documents || []), data.document]
              }
            }
          };
        });
      }
    } catch (err) {
      console.error('Meeting file upload failed', err);
    } finally {
      setUploadingMeetingDoc(false);
    }
  };

  const removeMeetingDoc = async (docPath) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/meeting-attachment`, {
        method: 'DELETE',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filePath: docPath }),
      });
      
      if (res.ok) {
        setResourceForm(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.path !== docPath)
        }));
        
        onUpdate(client.email, c => ({
          ...c,
          adminData: {
            ...c.adminData,
            meetingAssets: {
              ...c.adminData.meetingAssets,
              documents: (c.adminData.meetingAssets.documents || []).filter(d => d.path !== docPath)
            }
          }
        }));
      }
    } catch (err) {
      console.error('Failed to delete meeting document:', err);
    }
  };

  const saveResources = async () => {
    setLoading(true);
    const m = meetings[editingResources];
    const currentAssets = client.adminData?.meetingAssets || { recordings: [], documents: [], notes: [] };
    
    // Update recordings
    let updatedRecordings = [...(currentAssets.recordings || [])];
    const recIdx = updatedRecordings.findIndex(r => r.meetingTitle === m.title && r.meetingDate === m.date);
    if (recIdx > -1) {
      updatedRecordings[recIdx].link = resourceForm.recordingLink;
    } else {
      updatedRecordings.push({ meetingTitle: m.title, meetingDate: m.date, link: resourceForm.recordingLink });
    }

    // Update notes
    let updatedNotes = [...(currentAssets.notes || [])];
    const noteIdx = updatedNotes.findIndex(n => n.meetingTitle === m.title && n.meetingDate === m.date);
    if (noteIdx > -1) {
      updatedNotes[noteIdx].content = resourceForm.notes;
    } else {
      updatedNotes.push({ meetingTitle: m.title, meetingDate: m.date, content: resourceForm.notes });
    }

    const newAssets = {
      ...currentAssets,
      recordings: updatedRecordings,
      notes: updatedNotes,
      // documents are already handled by handleFileUpload/removeMeetingDoc for simplicity or we can sync them here too
      documents: (currentAssets.documents || []) // Assuming documents are kept in sync via upload/delete calls
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { meetingAssets: newAssets } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, meetingAssets: newAssets } }));
        setEditingResources(null);
      }
    } catch (err) {
      console.error('Failed to save meeting assets:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabPanel>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><CalendarIcon className="text-accent-400" size={18} /> Scheduling</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 text-xs font-bold transition-colors">
          {isAdding ? 'Cancel' : '+ New Meeting'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd} 
            className="mb-8 overflow-hidden"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Meeting Purpose</label>
                  <input 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    placeholder="e.g., Creative Direction Sync"
                    className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-accent-500/50 focus:ring-4 focus:ring-accent-500/5 transition-all" 
                  />
                </div>
                
                <DeliveryScheduler 
                  className="bg-zinc-950/80 border-zinc-800/50 mt-2"
                  timeZone="Pacific Standard Time"
                  timeSlots={['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']}
                  onSchedule={({ date, time }) => {
                    setForm({ ...form, date: date.toISOString().split('T')[0], time });
                  }}
                  onCancel={() => setIsAdding(false)}
                />

                <AnimatePresence>
                  {form.date && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-between group overflow-hidden relative"
                    >
                       <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 blur-2xl pointer-events-none" />
                       <div className="flex items-center gap-4 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                            <Clock size={18} className="text-accent-400" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-accent-400 uppercase tracking-widest">Confirmed Time Slot</span>
                             <span className="text-sm font-bold text-white">
                               {new Date(form.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {form.time}
                             </span>
                          </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative z-10">
                         <CheckCircle2 size={16} className="text-emerald-400" />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="group">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Meeting Location</label>
                  <div className="relative">
                    <input 
                      value={form.link} 
                      onChange={e => setForm({...form, link: e.target.value})} 
                      placeholder="Zoom, Google Meet, or physical address"
                      className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-2xl px-4 py-3.5 pl-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-accent-500/50 focus:ring-4 focus:ring-accent-500/5 transition-all" 
                    />
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent-400 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !form.date || !form.time} 
                  className="flex-1 py-4 bg-gradient-to-r from-accent-500 to-brand-brand-purple-600 hover:from-accent-600 hover:to-brand-brand-purple-700 text-white text-sm font-black rounded-2xl transition-all shadow-[0_10px_30_rgba(79,70,229,0.2)] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      <CalendarIcon size={18} />
                      Finalize Meeting
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <Section title="Upcoming Meetings" icon={CalendarIcon}>
        {upcoming.length === 0 ? <p className="text-sm text-zinc-600 italic">No upcoming meetings.</p> : (
          <div className="flex flex-col gap-2">
            {upcoming.map((m, i) => {
              const oIndex = getOriginalIndex(m);
              return (
                <div key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3 group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center flex-shrink-0"><CalendarIcon size={16} className="text-accent-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{m.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{new Date(m.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} {m.time && `at ${m.time}`}</p>
                      {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="text-[11px] text-accent-400 hover:text-accent-300 mt-1.5 inline-flex items-center gap-1"><ExternalLink size={10} /> Join Meeting</a>}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-zinc-800/50 pt-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleStatus(oIndex, 'Completed')} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors">Complete</button>
                    <button onClick={() => handleStatus(oIndex, 'Cancelled')} className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white text-xs font-bold transition-colors">Cancel</button>
                    <button onClick={() => handleDelete(oIndex)} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title="Meeting Archives" icon={Clock}>
          <div className="flex flex-col gap-3">
            {past.map((m, i) => {
              const oIndex = getOriginalIndex(m);
              const isEditing = editingResources === oIndex;

              return (
                <div key={i} className="rounded-2xl bg-zinc-950/40 border border-zinc-800/60 overflow-hidden transition-all hover:border-zinc-700/80">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {m.status === 'Completed' ? <CheckCircle2 size={14} /> : <X size={14} />}
                       </div>
                       <div className="flex flex-col">
                         <p className="text-sm font-bold text-zinc-200">{m.title}</p>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {m.status === 'Completed' && (
                         <button 
                           onClick={() => handleOpenResources(oIndex)}
                           className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-accent-400 hover:border-accent-500/30 text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                           {isEditing ? 'Discard' : (m.recordingLink || m.documents?.length > 0 ? 'Edit Assets' : 'Add Assets')}
                         </button>
                       )}
                       <button onClick={() => handleDelete(oIndex)} className="p-2 text-zinc-600 hover:text-rose-400 transition-colors">
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-800/80 bg-zinc-900/20"
                      >
                        <div className="p-5 flex flex-col gap-4">
                          <div>
                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Recording Link</label>
                            <input 
                              value={resourceForm.recordingLink}
                              onChange={e => setResourceForm({...resourceForm, recordingLink: e.target.value})}
                              placeholder="vimeo.com/..., zoom.us/rec/..."
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent-500/50"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Session Documents</label>
                              <button 
                                onClick={() => meetingFileRef.current?.click()} 
                                disabled={uploadingMeetingDoc}
                                className="text-[9px] font-black text-accent-400 hover:text-accent-300 uppercase flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                {uploadingMeetingDoc ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                                Upload Document
                              </button>
                              <input 
                                type="file" 
                                ref={meetingFileRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              {resourceForm.documents.length === 0 ? (
                                <div className="py-4 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center opacity-40">
                                  <FileText size={16} className="mb-1 text-zinc-500" />
                                  <p className="text-[10px] font-bold">No documents attached.</p>
                                </div>
                              ) : (
                                resourceForm.documents.map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/50 hover:border-zinc-700/50 transition-all group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
                                        <FileText size={14} />
                                      </div>
                                      <div className="flex flex-col">
                                        <p className="text-[11px] font-bold text-zinc-200">{doc.name}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium">{doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <a 
                                        href={`${API_BASE_URL}${doc.path}`} 
                                        download={doc.name}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 text-zinc-500 hover:text-accent-400 transition-colors"
                                      >
                                        <Download size={14} />
                                      </a>
                                      <button 
                                        onClick={() => removeMeetingDoc(doc.path)} 
                                        className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 mt-2">
                             <button onClick={() => setEditingResources(null)} className="text-[10px] font-bold text-zinc-500">Cancel</button>
                             <button onClick={saveResources} className="px-4 py-2 bg-accent-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-accent-500/20">Sync Resources</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </TabPanel>
  );
}

function DatePickerField({ value, onChange, label, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value ? (() => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  })() : undefined);

  // Update temp date when popover opens
  useEffect(() => {
    if (open) {
      if (value) {
        const [y, m, d] = value.split('-').map(Number);
        setTempDate(new Date(y, m - 1, d));
      } else {
        setTempDate(undefined);
      }
    }
  }, [open, value]);

  const handleApply = () => {
    if (tempDate) {
      const y = tempDate.getFullYear();
      const m = String(tempDate.getMonth() + 1).padStart(2, '0');
      const d = String(tempDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    setOpen(false);
  };

  return (
    <div>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative group cursor-pointer">
            <input 
              readOnly
              value={value ? format(new Date(value.split('-')[0], value.split('-')[1]-1, value.split('-')[2]), 'MMM d, yyyy') : ''} 
              placeholder={placeholder}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-accent-500/50 pr-10 cursor-pointer transition-colors group-hover:border-zinc-700" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-accent-400 transition-colors pointer-events-none">
              <CalendarIcon size={14} />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] rounded-2xl overflow-hidden" align="start">
          <div className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Select Date</span>
              {value && (
                <span className="text-[9px] font-bold text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full border border-accent-500/20">
                  {format(new Date(value.split('-')[0], value.split('-')[1]-1, value.split('-')[2]), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            
            <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/50 p-1">
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                initialFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-800/60">
              <button 
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleApply}
                className="px-6 py-2 bg-gradient-to-r from-accent-600 to-brand-brand-purple-600 hover:from-accent-500 hover:to-brand-brand-purple-500 text-white text-[11px] font-black rounded-xl shadow-lg shadow-accent-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                APPLY DATE
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function BillingTab({ client, authHeader, onUpdate }) {
  const ad = client.adminData || {};
  const sub = ad.subscription || {};
  const invoices = ad.invoices || [];
  const status = ad.projectStatus || 'Unassigned';
  const isActive = status === 'Active';

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: sub.invoiceNumber || '',
    transactionId: '',
    paymentMethod: 'Bank Transfer'
  });
  const [invoiceFile, setInvoiceFile] = useState(null);

  const PRICING_PLANS = {
    'tier1': { name: 'Starter', price: '₹7,200' },
    'tier2': { name: 'Growth', price: '₹12,600' },
    'tier3': { name: 'Business', price: '₹15,000' },
    'tier4': { name: 'E-com', price: '₹24,500' }
  };

  // Auto-fill based on consultation if not set
  const consultationPlan = client.consultations?.[0]?.plan;
  const recommendedPlan = PRICING_PLANS[consultationPlan] || { name: 'Custom', price: '' };

  const handleUpdateSubscription = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    const updatedSub = {
      planName: sub.planName || recommendedPlan.name,
      price: sub.price || recommendedPlan.price,
      nextBilling: sub.nextBilling || '',
      invoiceNumber: invoiceForm.invoiceNumber
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { subscription: updatedSub } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, subscription: updatedSub } }));
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceFile && !invoiceForm.description) return;
    
    setUploading(true);
    let fileLink = '';

    if (invoiceFile) {
      const fd = new FormData();
      fd.append('file', invoiceFile);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/upload`, {
          method: 'POST', headers: authHeader, credentials: 'include', body: fd,
        });
        const data = await res.json();
        if (res.ok && data.attachment) {
          fileLink = data.attachment.path;
        }
      } catch (err) {
        console.error('Invoice upload failed', err);
        setUploading(false);
        return;
      }
    }

    const newInvoice = {
      description: invoiceForm.description || `Invoice #${invoiceForm.invoiceNumber}`,
      amount: invoiceForm.amount,
      date: invoiceForm.date,
      status: 'Paid',
      link: fileLink,
      transactionId: invoiceForm.transactionId,
      paymentMethod: invoiceForm.paymentMethod
    };

    const updatedInvoices = [newInvoice, ...invoices];

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { invoices: updatedInvoices } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, invoices: updatedInvoices } }));
        setInvoiceForm({ ...invoiceForm, description: '', amount: '', transactionId: '', paymentMethod: 'Bank Transfer' });
        setInvoiceFile(null);
      }
    } catch (err) {
      console.error('Failed to save invoice:', err);
    } finally {
      setUploading(false);
    }
  };

  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleDeleteInvoice = async (index) => {
    setConfirmingDelete(null);
    const updatedInvoices = invoices.filter((_, i) => i !== index);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { invoices: updatedInvoices } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, invoices: updatedInvoices } }));
      }
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  if (!isActive) {
    return (
      <TabPanel>
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <CreditCard size={32} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-400">Billing Unavailable</p>
            <p className="text-xs mt-1">Project must be in "Active" state to manage billing.</p>
          </div>
        </div>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section title="Subscription Status" icon={CreditCard}>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Plan</p>
                  <p className="font-bold text-lg text-white">{sub.planName || recommendedPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Price</p>
                  <p className="font-bold text-lg text-accent-400">{sub.price || recommendedPlan.price}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800/50">
                <DatePickerField 
                  label="Next Billing"
                  value={sub.nextBilling}
                  onChange={(val) => onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, subscription: { ...c.adminData.subscription, nextBilling: val } } }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1">
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Invoice #</label>
                   <input 
                    value={invoiceForm.invoiceNumber} 
                    onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
                    placeholder="INV-001"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent-500/50" 
                  />
                </div>
                <button 
                  onClick={handleUpdateSubscription}
                  disabled={loading}
                  className="mt-5 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Update Info'}
                </button>
              </div>
            </div>
          </Section>

          <Section title="Record New Payment" icon={Plus}>
            <form onSubmit={handleUploadInvoice} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                  <input 
                    required
                    value={invoiceForm.description} 
                    onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})}
                    placeholder="e.g., Monthly Maintenance Fee"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent-500/50" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Amount</label>
                    <input 
                      required
                      value={invoiceForm.amount} 
                      onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                      placeholder="₹7,200"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent-500/50" 
                    />
                  </div>
                  <DatePickerField 
                    label="Date Paid"
                    value={invoiceForm.date}
                    onChange={(val) => setInvoiceForm({...invoiceForm, date: val})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Transaction ID</label>
                    <input 
                      value={invoiceForm.transactionId} 
                      onChange={e => setInvoiceForm({...invoiceForm, transactionId: e.target.value})}
                      placeholder="TXN123..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent-500/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 flex items-center justify-between hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const m = invoiceForm.paymentMethod;
                              if (m === 'Stripe') return <CreditCard size={14} className="text-accent-400" />;
                              if (m === 'UPI') return <Smartphone size={14} className="text-emerald-400" />;
                              if (m === 'Bank Transfer') return <Building2 size={14} className="text-amber-400" />;
                              if (m === 'PayPal') return <Wallet size={14} className="text-sky-400" />;
                              return <CreditCard size={14} className="text-zinc-500" />;
                            })()}
                            <span>{invoiceForm.paymentMethod}</span>
                          </div>
                          <ChevronDown size={14} className="text-zinc-500" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-1 bg-zinc-950/95 backdrop-blur-xl border-zinc-800 shadow-2xl rounded-xl">
                        {[
                          { id: 'Bank Transfer', icon: Building2, color: 'text-amber-400' },
                          { id: 'Stripe', icon: CreditCard, color: 'text-accent-400' },
                          { id: 'UPI', icon: Smartphone, color: 'text-emerald-400' },
                          { id: 'PayPal', icon: Wallet, color: 'text-sky-400' },
                          { id: 'Cash', icon: CreditCard, color: 'text-zinc-400' }
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setInvoiceForm({...invoiceForm, paymentMethod: method.id})}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${invoiceForm.paymentMethod === method.id ? 'bg-accent-500/10 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                          >
                            <method.icon size={14} className={method.color} />
                            <span className="font-bold">{method.id}</span>
                            {invoiceForm.paymentMethod === method.id && <div className="ml-auto w-1 h-1 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Invoice File (Optional)</label>
                  <label className={`w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 rounded-lg px-4 py-3 text-xs cursor-pointer transition-all ${invoiceFile ? 'bg-accent-500/10 text-accent-400 border-accent-500/30' : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Upload size={14} />
                    <span className="truncate">{invoiceFile ? invoiceFile.name : 'Click to upload PDF/Image'}</span>
                    <input type="file" className="hidden" onChange={e => setInvoiceFile(e.target.files[0] || null)} />
                  </label>
                </div>
              </div>
              <button 
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={14} /> Record Payment & Upload</>}
              </button>
            </form>
          </Section>
        </div>

        <Section title="Payment History" icon={Clock}>
          {invoices.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-600 gap-2 italic">
              <CreditCard size={24} />
              <p className="text-xs">No payment records found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {invoices.map((inv, i) => {
                let downloadLink = inv.link;
                if (inv.link?.includes('/uploads/')) {
                  const path = inv.link.includes('://') ? new URL(inv.link).pathname : inv.link;
                  downloadLink = `${API_BASE_URL}/api/download?file=${encodeURIComponent(path)}`;
                }
                
                return (
                  <div key={i} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white truncate mb-1">{inv.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon size={10} className="text-zinc-500" />
                              <span className="text-[10px] font-bold text-zinc-400">{inv.date}</span>
                            </div>
                            {inv.paymentMethod && (
                              <div className="flex items-center gap-1.5">
                                <CreditCard size={10} className="text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-400">{inv.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-white">{inv.amount}</p>
                          {confirmingDelete !== i && (
                            <button 
                              onClick={() => setConfirmingDelete(i)}
                              className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-600 hover:text-red-500 hover:border-red-500/50 transition-all ml-1"
                              title="Delete Record"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">Verified</span>
                        </div>
                      </div>
                    </div>
                    
                    {confirmingDelete === i && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-1.5">
                          <span className="text-[10px] font-bold text-red-400">Permanently delete record?</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setConfirmingDelete(null)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 px-2 py-1">Cancel</button>
                            <button onClick={() => handleDeleteInvoice(i)} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg transition-all">DELETE</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {(inv.transactionId || downloadLink) && confirmingDelete !== i && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between min-h-[32px]">
                        <div className="flex items-center gap-2">
                          {inv.transactionId && (
                            <div className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 flex items-center gap-2">
                              <span className="text-[9px] font-black text-zinc-600 uppercase">TXN ID</span>
                              <span className="text-[10px] font-mono text-accent-400 font-bold">{inv.transactionId}</span>
                            </div>
                          )}
                        </div>
                        {downloadLink && (
                          <a href={downloadLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-[10px] font-bold transition-colors bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 hover:border-zinc-600">
                            <Download size={12} />
                            DOWNLOAD
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </TabPanel>
  );
}

function MessagesTab({ client, authHeader, onUpdate }) {
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('General Update');
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const msg = {
      sender: 'System Admin',
      senderRole: 'admin',
      subject: subject,
      content: newMessage,
      date: new Date(),
      isRead: false
    };

    const updatedMessages = [...(client.adminData?.messages || []), msg];

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { messages: updatedMessages } })
      });

      if (res.ok) {
        onUpdate(client.email, c => ({
          ...c,
          adminData: { ...c.adminData, messages: updatedMessages }
        }));
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const [showArchived, setShowArchived] = useState(false);
  const allMessages = (client.adminData?.messages || []);
  const visibleMessages = allMessages.filter(m => showArchived || !m.isArchived).slice().reverse();
  const unreadCount = allMessages.filter(m => !m.isRead && m.senderRole === 'user').length;

  const handleArchiveAll = async () => {
    const updatedMessages = allMessages.map(m => ({ ...m, isArchived: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { messages: updatedMessages } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({
          ...c,
          adminData: { ...c.adminData, messages: updatedMessages }
        }));
      }
    } catch (err) {
      console.error('Failed to archive messages:', err);
    }
  };

  const markAllAsRead = async () => {
    const updatedMessages = allMessages.map(m => ({ ...m, isRead: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { messages: updatedMessages } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({
          ...c,
          adminData: { ...c.adminData, messages: updatedMessages }
        }));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <TabPanel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Message List */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Section 
            title="Direct Thread" 
            icon={MessageSquare}
            action={
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className={`text-[9px] font-black px-2 py-1 rounded border transition-all ${
                    showArchived ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-400'
                  }`}
                >
                  {showArchived ? 'HIDE ARCHIVED' : 'SHOW HISTORY'}
                </button>
                {visibleMessages.length > 0 && !showArchived && (
                  <button 
                    onClick={handleArchiveAll}
                    className="text-[9px] font-black text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"
                  >
                    CLEAR THREAD
                  </button>
                )}
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[9px] font-black text-accent-400 hover:text-accent-300 transition-colors bg-accent-500/10 px-2 py-1 rounded border border-accent-500/20"
                  >
                    MARK READ
                  </button>
                )}
              </div>
            }
          >
            {visibleMessages.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Thread is clean.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {visibleMessages.map((msg, i) => {
                  const isUser = msg.senderRole === 'user';
                  const msgDate = msg.date ? new Date(msg.date) : new Date();
                  const showDateSeparator = i === 0 || new Date(visibleMessages[i-1].date).toDateString() !== msgDate.toDateString();

                  return (
                    <Fragment key={i}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-4 my-2 opacity-30">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                          <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">
                            {msgDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                        </div>
                      )}
                      <div 
                        className={`group relative p-3.5 rounded-2xl border transition-all duration-300 max-w-[85%] ${
                          isUser 
                            ? 'bg-zinc-950/60 border-zinc-800/60 self-start' 
                            : 'bg-accent-500/5 border-accent-500/20 self-end ml-12'
                        } ${!msg.isRead && isUser ? 'ring-1 ring-accent-500/40 shadow-xl shadow-accent-500/5' : ''} ${msg.isArchived ? 'opacity-50 grayscale-[0.5]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-6 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isUser ? 'text-zinc-500' : 'text-accent-400/80'}`}>
                              {isUser ? (client.displayName || 'Client') : 'System Admin'}
                            </span>
                          </div>
                          <span className="text-[8px] text-zinc-600 font-bold tabular-nums">
                            {msgDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        
                        {msg.subject && msg.subject !== 'Update' && (
                          <div className="mb-2">
                            <span className="text-[9px] font-bold text-zinc-500 px-1.5 py-0.5 bg-zinc-900/80 rounded border border-zinc-800/50">
                              {msg.subject}
                            </span>
                          </div>
                        )}
                        
                        <p className={`text-[13px] leading-relaxed ${isUser ? 'text-zinc-400' : 'text-zinc-200'}`}>
                          {msg.content}
                        </p>

                        {!msg.isRead && isUser && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full border border-zinc-950 shadow-lg shadow-accent-500/40 animate-pulse" />
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Right Column: Compose */}
        <div className="flex flex-col gap-5">
          <Section title="Send Message" icon={Send}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Subject</label>
                <div className="relative group/sel">
                  <button
                    type="button"
                    onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                    className={`w-full bg-zinc-950 border rounded-xl px-10 py-2.5 text-xs text-left transition-all flex items-center justify-between ${
                      isSubjectOpen ? 'border-accent-500/50 ring-2 ring-accent-500/10' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-zinc-500">
                        {subject === 'General Update' && <RefreshCw size={12} />}
                        {subject === 'Milestone Reached' && <CheckCircle2 size={12} className="text-emerald-500" />}
                        {subject === 'Action Required' && <AlertCircle size={12} className="text-amber-500" />}
                        {subject === 'File Uploaded' && <Paperclip size={12} className="text-blue-500" />}
                        {subject === 'Billing Update' && <CreditCard size={12} className="text-rose-500" />}
                      </div>
                      <span className="text-zinc-300">{subject}</span>
                    </div>
                    <ChevronDown size={12} className={`text-zinc-600 transition-transform duration-300 ${isSubjectOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isSubjectOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSubjectOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-full mt-2 bg-zinc-900/95 border border-zinc-800/80 rounded-xl overflow-hidden z-50 backdrop-blur-xl shadow-2xl shadow-black/40"
                        >
                          {[
                            { value: "General Update", icon: RefreshCw, color: "text-zinc-400" },
                            { value: "Milestone Reached", icon: CheckCircle2, color: "text-emerald-500" },
                            { value: "Action Required", icon: AlertCircle, color: "text-amber-500" },
                            { value: "File Uploaded", icon: Paperclip, color: "text-blue-500" },
                            { value: "Billing Update", icon: CreditCard, color: "text-rose-500" }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setSubject(opt.value);
                                setIsSubjectOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-white/[0.03] ${
                                subject === opt.value ? 'bg-accent-500/10 text-accent-400' : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              <opt.icon size={12} className={opt.color} />
                              {opt.value}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Message Body</label>
                <div className="relative group/text">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to the client..."
                    className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-accent-500/50 transition-all resize-none custom-scrollbar relative z-10"
                  />
                  {/* Backdrop glow */}
                  <div className="absolute inset-0 bg-accent-500/0 group-focus-within/text:bg-accent-500/[0.02] transition-all rounded-xl pointer-events-none" />
                </div>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="w-full py-3.5 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                {sending ? 'Sending...' : (
                  <>
                    SEND MESSAGE
                    <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </Section>

          <Section title="Quick Templates" icon={Sparkles}>
            <div className="flex flex-col gap-2">
              {[
                { t: "Check the 'Assets' tab for your latest deliverables.", s: "File Uploaded" },
                { t: "We've completed the current milestone. Please review.", s: "Milestone Reached" },
                { t: "We need some additional information from your side.", s: "Action Required" }
              ].map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => { setNewMessage(tmpl.t); setSubject(tmpl.s); }}
                  className="w-full text-left p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 hover:border-zinc-700 transition-all group"
                >
                  <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 line-clamp-2">{tmpl.t}</p>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </TabPanel>
  );
}

function AssetsTab({ client, authHeader, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileRef = useRef(null);
  const ad = client?.adminData || {};
  const attachments = ad.attachments || [];
  const deliverables = ad.deliverables || [];
  const palettes = client?.favoritePalettes || [];
  const fonts = client?.favoriteFonts || [];
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({ title: '', link: '' });
  const [deliverableFile, setDeliverableFile] = useState(null);
  const [savingDeliverable, setSavingDeliverable] = useState(false);

  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableForm.title) return;
    if (!deliverableForm.link && !deliverableFile) return;
    
    setSavingDeliverable(true);
    let finalLink = deliverableForm.link;

    if (deliverableFile) {
      const fd = new FormData();
      fd.append('file', deliverableFile);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/upload`, {
          method: 'POST', headers: authHeader, credentials: 'include', body: fd,
        });
        const data = await res.json();
        if (res.ok && data.attachment) {
          finalLink = data.attachment.path; // Store relative path: /uploads/filename.ext
          onUpdate(client.email, c => ({
            ...c,
            adminData: { ...c.adminData, attachments: [...(c.adminData?.attachments || []), data.attachment] }
          }));
        }
      } catch (err) {
        console.error('File upload failed', err);
        setSavingDeliverable(false);
        return;
      }
    }

    const newDeliverables = [{ title: deliverableForm.title, link: finalLink, uploadDate: new Date() }, ...deliverables];
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { deliverables: newDeliverables } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, deliverables: newDeliverables } }));
        setIsAddingDeliverable(false);
        setDeliverableForm({ title: '', link: '' });
        setDeliverableFile(null);
      }
    } catch (err) {
      console.error('Failed to save deliverables:', err);
    } finally {
      setSavingDeliverable(false);
    }
  };

  const handleDeleteDeliverable = async (index) => {
    const updated = [...deliverables];
    updated.splice(index, 1);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminData: { deliverables: updated } })
      });
      if (res.ok) {
        onUpdate(client.email, c => ({ ...c, adminData: { ...c.adminData, deliverables: updated } }));
      }
    } catch (err) {
      console.error('Failed to delete deliverable:', err);
    }
  };

  const doUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const results = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/upload`, {
          method: 'POST', headers: authHeader, credentials: 'include', body: fd,
        });
        const data = await res.json();
        if (res.ok && data.attachment) results.push(data.attachment);
      } catch { /* noop */ }
    }
    if (results.length) {
      onUpdate(client.email, c => ({
        ...c,
        adminData: { ...c.adminData, attachments: [...(c.adminData?.attachments || []), ...results] }
      }));
    }
    setUploading(false);
  };

  const doDelete = async (att) => {
    setDeleteId(att.path);
    try {
      await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(client.email)}/attachment`, {
        method: 'DELETE', headers: { ...authHeader, 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ filePath: att.path }),
      });
      onUpdate(client.email, c => ({
        ...c,
        adminData: { ...c.adminData, attachments: (c.adminData?.attachments || []).filter(a => a.path !== att.path) }
      }));
    } finally { setDeleteId(null); }
  };

  const getIcon = (name = '') => {
    if (!name) return '📎';
    try {
      const ext = String(name).split('.').pop().toLowerCase();
      if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
      if (['pdf'].includes(ext)) return '📄';
      if (['zip','rar','7z'].includes(ext)) return '🗜️';
      if (['mp4','mov','avi'].includes(ext)) return '🎬';
      if (['doc','docx'].includes(ext)) return '📝';
    } catch(e) {}
    return '📎';
  };

  return (
    <TabPanel>
      {/* Deliverables Hub */}
      <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Folder size={10} />Deliverables Hub</p>
          <button onClick={() => setIsAddingDeliverable(!isAddingDeliverable)} className="px-2.5 py-1 rounded-lg bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 text-[10px] font-bold transition-colors">
            {isAddingDeliverable ? 'Cancel' : '+ Add Link'}
          </button>
        </div>

        <AnimatePresence>
          {isAddingDeliverable && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-zinc-800/60 bg-zinc-900/20" onSubmit={handleAddDeliverable}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400">Deliverable Title</label>
                  <input required value={deliverableForm.title} onChange={e => setDeliverableForm({...deliverableForm, title: e.target.value})} placeholder="e.g., Final Logo Package"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 transition-all placeholder:text-zinc-600" />
                </div>
                
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400">External URL</label>
                    <input disabled={!!deliverableFile} value={deliverableForm.link} onChange={e => setDeliverableForm({...deliverableForm, link: e.target.value})} placeholder="https://drive.google.com/..."
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 transition-all placeholder:text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed" />
                  </div>
                  
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-5">OR</div>
                  
                  <div className="space-y-1.5 flex flex-col justify-end h-full">
                    <label className="text-[11px] font-semibold text-zinc-400">Upload File</label>
                    <label className={`w-full flex items-center justify-center gap-2 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm cursor-pointer transition-all ${deliverableFile ? 'bg-accent-500/10 text-accent-400 border-accent-500/30' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}`}>
                      <Upload size={14} />
                      <span className="truncate">{deliverableFile ? deliverableFile.name : 'Select from computer'}</span>
                      <input type="file" className="hidden" onChange={e => {
                        setDeliverableFile(e.target.files[0] || null);
                        if (e.target.files[0]) setDeliverableForm({...deliverableForm, link: ''});
                      }} />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button disabled={savingDeliverable || (!deliverableForm.link && !deliverableFile)} type="submit" className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20">
                    {savingDeliverable ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Save Deliverable</>}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {deliverables.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-600 gap-2 text-xs italic"><Folder size={16} /><span>No deliverables uploaded yet</span></div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800/40">
            {deliverables.map((d, i) => {
              if (!d) return null;
              
              // Determine the final link
              let downloadLink = d.link;
              if (d.link?.includes('/uploads/')) {
                // It's a local upload - use the download endpoint
                const path = d.link.includes('://') ? new URL(d.link).pathname : d.link;
                downloadLink = `${API_BASE_URL}/api/download?file=${encodeURIComponent(path)}`;
              } else if (d.link && !d.link.includes('://') && !d.link.startsWith('/') && !d.link.startsWith('#')) {
                // External link without protocol
                downloadLink = `https://${d.link}`;
              }

              return (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-900/40 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0"><Folder size={16} className="text-accent-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col">
                    <a href={downloadLink} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-zinc-200 group-hover:text-accent-400 transition-colors truncate">{d.title || 'Deliverable'}</a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">{d.uploadDate ? new Date(d.uploadDate).toLocaleDateString() : ''}</span>
                      <span className="text-zinc-700 text-[10px]">•</span>
                      <span className="text-[10px] text-zinc-500 truncate max-w-[250px]">{d.link}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={downloadLink} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-accent-400 transition-colors"><ExternalLink size={14} /></a>
                  <button onClick={() => handleDeleteDeliverable(i)} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {palettes.length > 0 && (
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/60">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">🎨 Favorite Palettes</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {palettes.map((pName, i) => {
              const p = palettesData.find(pd => pd.name === pName);
              if (!p) return null;
              return (
                <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  <div className="flex h-10">
                    {(p.colors || []).slice(0, 5).map((c, ci) => (
                      <div key={ci} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-300 px-2.5 py-2 truncate">{p.name || `Palette ${i + 1}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fonts.length > 0 && (
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden mt-6">
          <div className="px-5 py-3 border-b border-zinc-800/60">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">🔤 Favorite Fonts</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {fonts.map((fName, i) => {
              const f = fontsData.find(fd => fd.name === fName);
              if (!f) return null;
              return (
                <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
                  <div className="h-20 flex items-center justify-center bg-zinc-950/50 overflow-hidden relative group">
                    <span className="text-4xl font-normal text-zinc-300" style={{ fontFamily: f.family || f.name || 'sans-serif' }}>Ag</span>
                  </div>
                  <div className="p-3 border-t border-zinc-800 flex flex-col">
                    <p className="text-xs font-bold text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">{f.category || 'Typography'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <motion.div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); doUpload(e.dataTransfer.files); }}
        onClick={() => !uploading && fileRef.current?.click()}
        animate={{ borderColor: dragOver ? 'rgba(99,102,241,0.6)' : 'rgba(63,63,70,0.5)', backgroundColor: dragOver ? 'rgba(99,102,241,0.05)' : 'rgba(9,9,11,0.4)' }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer group mt-6"
      >
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => doUpload(e.target.files)} />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dragOver ? 'bg-accent-500/20 text-accent-400' : 'bg-zinc-800 text-zinc-500 group-hover:bg-accent-500/10 group-hover:text-accent-400'}`}>
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-300">{uploading ? 'Uploading…' : dragOver ? 'Drop files here' : 'Upload Reference Files'}</p>
          <p className="text-xs text-zinc-600 mt-1">Any type · Max 50MB</p>
        </div>
      </motion.div>

      {attachments.length > 0 && (
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden mt-6">
          <div className="px-5 py-3 border-b border-zinc-800/60">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Paperclip size={10} />Uploaded Reference Files ({attachments.length})</p>
          </div>
          <div className="flex flex-col divide-y divide-zinc-800/40">
            {attachments.map((att, i) => att ? (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group">
                <span className="text-xl flex-shrink-0">{getIcon(att.name)}</span>
                <div className="flex-1 min-w-0">
                  <a href={`${API_BASE_URL}/api/download?file=${encodeURIComponent(att.path)}`} target="_blank" rel="noreferrer"
                    className="text-sm font-medium text-zinc-200 hover:text-accent-400 transition-colors truncate block">{att.name || 'File'}</a>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{att.size} · {att.uploadDate ? new Date(att.uploadDate).toLocaleDateString() : ''}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={att.path ? `${API_BASE_URL}/api/download?file=${encodeURIComponent(att.path)}` : '#'} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-accent-400 transition-colors"><ExternalLink size={12} /></a>
                  <button onClick={() => doDelete(att)} disabled={deleteId === att.path} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-40">
                    {deleteId === att.path ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </motion.div>
            ) : null)}
          </div>
        </div>
      )}
    </TabPanel>
  );
}
