import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Phone, Mail, Calendar, Building, Briefcase, DollarSign, MessageSquare, ExternalLink, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';


const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const openGmailReply = (email, name = 'there', service = 'Consultation') => {
  if (!email || !email.includes('@')) {
    alert("Invalid or missing email address.");
    return;
  }

  const subject = encodeURIComponent(`Re: Your ${service} Consultation Request - MKAVS`);
  const body = encodeURIComponent(`Hi ${name},\n\nThank you for reaching out regarding your interest in our ${service} services. I've reviewed your request and would love to discuss how we can help.\n\nBest regards,\nAdmin Team`);

  // Primary Gmail URL (fs=1 opens in fullscreen compose mode)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  
  // Standard mailto fallback
  const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

  // Attempt to open Gmail in a new tab
  const newTab = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  
  // If browser blocks the popup or Gmail fails to open, fallback to mailto
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    window.location.href = mailtoUrl;
  }
};

const mockUsers = [
  { id: 1, name: 'Alice Waverly', email: 'alice@quantum.io', phone: '+1 555-0101', company: 'Quantum Tech', role: 'CEO', signedUp: '2026-04-10', status: 'Active Trial', location: 'San Francisco, CA', ltv: '$0.00' },
  { id: 2, name: 'David Chen', email: 'david.c@nexus.net', phone: '+1 555-0102', company: 'Nexus Logistics', role: 'Operations', signedUp: '2026-04-12', status: 'Pro Subscriber', location: 'New York, NY', ltv: '$12,450' },
  { id: 3, name: 'Sarah Jenkins', email: 's.jenkins@studio.design', phone: '+1 555-0103', company: 'Studio 45', role: 'Founder', signedUp: '2026-04-15', status: 'Lead', location: 'London, UK', ltv: '$0.00' },
  { id: 4, name: 'Marcus Tyree', email: 'mtyree@growth.co', phone: '+1 555-0104', company: 'GrowthCo', role: 'Marketing Dir.', signedUp: '2026-04-18', status: 'Active Trial', location: 'Austin, TX', ltv: '$0.00' },
  { id: 5, name: 'Emma Watson', email: 'emma@watson.dev', phone: '+1 555-0105', company: 'Self-Employed', role: 'Freelancer', signedUp: '2026-04-20', status: 'Inactive', location: 'Berlin, DE', ltv: '$450' },
];

const mockConsultations = [
// Consultations are now dynamically extracted from the database users
];

export default function CRM({ user }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'consultations'
  const [selectedUser, setSelectedUser] = useState(null);
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, { 
          credentials: 'include',
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : ''
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load users');
        setDbUsers(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const targetUser = dbUsers.find(u => u._id === userId);
      if (!targetUser || !targetUser.email) throw new Error("User email not found");

      const res = await fetch(`${API_BASE_URL}/api/admin/user/${encodeURIComponent(targetUser.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({ adminData: { projectStatus: newStatus } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      // Update local state
      setDbUsers(prev => prev.map(u => u._id === userId ? { ...u, adminData: { ...u.adminData, projectStatus: newStatus } } : u));
      if (selectedUser?._id === userId) {
        setSelectedUser(prev => ({ ...prev, adminData: { ...prev.adminData, projectStatus: newStatus } }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const statusOptions = ['Unassigned', 'Assigned', 'Active', 'Completed'];
  const nextStatus = (current) => {
    const idx = statusOptions.indexOf(current || 'Unassigned');
    return statusOptions[(idx + 1) % statusOptions.length];
  };

  const dbConsultations = dbUsers.flatMap(u => 
    (u.consultations || []).map(c => ({
      ...c,
      userId: u._id,
      name: c.name || u.displayName || u.username || 'Unknown',
      email: c.email || u.email,
      phone: c.phone || u.phone || 'N/A',
      image: u.image || null
    }))
  ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-14rem)] min-h-[600px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1b] tracking-tight">Client Hub</h2>
          <p className="text-sm font-medium text-[#6a737d] mt-1">Manage external users and incoming business queries.</p>
        </div>
        
        <div className="flex bg-bg-surface p-1.5 rounded-xl border border-border-main shadow-sm transition-colors">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-bg-muted text-text-main border border-border-main shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Users size={16} /> Registered Users
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'consultations' 
                ? 'bg-bg-muted text-text-main border border-border-main shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <MessageSquare size={16} /> Consultations
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
          {/* User List */}
          <div className="lg:col-span-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col overflow-hidden">
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">User Database</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all placeholder:text-zinc-500 shadow-sm"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <AlertCircle size={24} className="text-rose-500" />
                <p className="text-xs">{error}</p>
              </div>
            ) : (
              <div 
                className="flex-1 overflow-y-auto pr-2 hide-scrollbar scroll-smooth overscroll-contain flex flex-col gap-2 relative pb-8 pt-4"
                style={{ 
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', 
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' 
                }}
              >
                {dbUsers.filter(u => {
                  const name = (u.displayName || u.username || 'Unknown User').toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const q = searchQuery.toLowerCase();
                  return name.includes(q) || email.includes(q);
                }).map(u => {
                  const name = u.displayName || u.username || 'Unknown User';
                  const statusLabel = u.adminData?.projectStatus || 'Unassigned';
                  return (
                    <div 
                      key={u._id}
                      onClick={() => { setSelectedUser(u); setStatusDropdownOpen(false); }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selectedUser?._id === u._id
                          ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {u.image ? (
                            <img src={getImageUrl(u.image)} alt={name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover shadow-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col overflow-hidden">
                            <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{name}</h4>
                            <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5 truncate"><Mail size={10}/> {u.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUserStatus(u._id, nextStatus(statusLabel));
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all hover:scale-105 active:scale-95 ${
                            statusLabel === 'Completed' ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-200/50 dark:border-sky-500/30' :
                            statusLabel === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30' :
                            statusLabel === 'Assigned' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30' :
                            'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {statusLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            {selectedUser ? (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedUser._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col h-full relative z-10"
                >
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-4">
                      {selectedUser.image ? (
                        <img 
                          src={getImageUrl(selectedUser.image)} 
                          alt={selectedUser.displayName || selectedUser.username} 
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-[1rem] object-cover shadow-md bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                          {(selectedUser.displayName || selectedUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{selectedUser.displayName || selectedUser.username}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            {selectedUser.role || 'User'}
                          </span>
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Joined {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:scale-105 transition-transform shadow-md">
                      <Mail size={14} /> Send Message
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 flex-1 overflow-y-auto hide-scrollbar pb-8">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {/* Contact Profile */}
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">Contact Profile</h4>
                        
                        <div className="grid grid-cols-1 gap-4 mt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><Mail size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Email Address</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedUser.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><Phone size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Phone Number</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedUser.consultations?.[0]?.phone || selectedUser.phone || 'Not Provided'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><MessageSquare size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Discord Handle</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedUser.consultations?.[0]?.discord || 'Not Provided'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><ExternalLink size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Preferred Contact</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate capitalize">{selectedUser.consultations?.[0]?.connectPreference || 'Email'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Project & Account Details */}
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">Project Overview</h4>
                        
                        <div className="grid grid-cols-1 gap-4 mt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-indigo-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><Briefcase size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Current Plan</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-widest">{selectedUser.consultations?.[0]?.plan || 'No Plan'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><Building size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Active Project</p>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedUser.adminData?.activeProjects || 'None Assigned'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-emerald-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"><TrendingUp size={14}/></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Project Progress</p>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedUser.adminData?.projectProgress || 0}%` }}></div>
                                </div>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-6 text-right">{selectedUser.adminData?.projectProgress || 0}%</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 relative overflow-visible">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0"><AlertCircle size={14}/></div>
                            <div className="flex-1 relative overflow-visible">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Project Status</p>
                              <div className="relative inline-block mt-0.5">
                                <button 
                                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                                    (selectedUser.adminData?.projectStatus || 'Unassigned') === 'Completed' ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/40 hover:bg-sky-200 dark:hover:bg-sky-500/30' :
                                    (selectedUser.adminData?.projectStatus || 'Unassigned') === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/30' :
                                    (selectedUser.adminData?.projectStatus || 'Unassigned') === 'Assigned' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/40 hover:bg-indigo-200 dark:hover:bg-indigo-500/30' :
                                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                  }`}
                                >
                                  {selectedUser.adminData?.projectStatus || 'Unassigned'}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${statusDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                                
                                <AnimatePresence>
                                  {statusDropdownOpen && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                                    >
                                      {statusOptions.map(opt => (
                                        <button
                                          key={opt}
                                          onClick={() => {
                                            updateUserStatus(selectedUser._id, opt);
                                            setStatusDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                                            (selectedUser.adminData?.projectStatus || 'Unassigned') === opt 
                                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' 
                                              : 'text-zinc-700 dark:text-zinc-300'
                                          }`}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consultation Notes */}
                    {selectedUser.consultations?.[0]?.projectInfo && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 dark:border-indigo-500/20 pb-2">
                          <MessageSquare size={12}/> Client's Project Brief
                        </h4>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                          "{selectedUser.consultations[0].projectInfo}"
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                <Users size={64} className="mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-sm">Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'consultations' && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col flex-1 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 relative z-10">Incoming Consultation Requests</h3>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto hide-scrollbar scroll-smooth overscroll-contain pb-8 pt-4 relative z-10"
            style={{ 
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', 
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' 
            }}
          >
            {dbConsultations.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-600">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-sm">No consultations found</p>
              </div>
            )}
            {dbConsultations.map((req, idx) => (
              <div key={req.id || idx} className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col hover:border-indigo-500/30 transition-all hover:shadow-lg group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    req.status === 'New' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                    req.status === 'Contacted' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                  }`}>
                    {req.status || 'Pending'}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1"><Calendar size={12}/> {req.date ? new Date(req.date).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-3 mb-1">
                  {req.image ? (
                    <img src={getImageUrl(req.image)} alt={req.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover shadow-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                      {(req.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{req.name}</h4>
                </div>
                <p className="text-xs text-zinc-500 font-medium mb-4 flex items-center gap-1.5"><Mail size={12}/> {req.email}</p>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Requested Service</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Briefcase size={14} className="text-zinc-400"/> {req.service || 'General Inquiry'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Est. Budget</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><DollarSign size={14}/> {req.budget || 'Not specified'}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 italic bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 leading-relaxed">
                      "{req.message || 'No additional details provided.'}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => openGmailReply(req.email, req.name, req.service)}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-bold transition-colors"
                  >
                    Reply
                  </button>
                  <button className="w-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Phone size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
