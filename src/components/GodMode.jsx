import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Send, Users, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function GodMode() {
  const [announcement, setAnnouncement] = useState('');
  const [sent, setSent] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({ enabled: false, scheduledFor: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/system-status`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setMaintenanceConfig({
            enabled: data.enabled || false,
            scheduledFor: data.scheduledFor ? new Date(data.scheduledFor).toISOString().slice(0, 16) : '',
            message: data.message || 'We are currently undergoing scheduled maintenance. Please check back shortly.'
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveMaintenance = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/system-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: maintenanceConfig.enabled,
          scheduledFor: maintenanceConfig.scheduledFor ? new Date(maintenanceConfig.scheduledFor).toISOString() : null,
          message: maintenanceConfig.message
        })
      });
      if (res.ok) alert('Maintenance settings applied successfully.');
      else alert('Failed to apply settings: ' + await res.text());
    } catch (e) {
      console.error(e);
      alert('Network error.');
    }
    setIsSaving(false);
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;

    // Fetch existing notifications or init array
    const existing = JSON.parse(localStorage.getItem('mkavs_notifications') || '[]');
    
    // Add new announcement
    const newNotif = {
      id: Date.now(),
      title: 'Global Announcement',
      message: announcement,
      type: 'broadcast',
      time: 'Just now'
    };
    
    localStorage.setItem('mkavs_notifications', JSON.stringify([newNotif, ...existing]));
    
    setAnnouncement('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="text-indigo-500" /> Admin God Mode
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-1">Global settings, access control, and master overrides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        
        {/* Announcement Broadcaster */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 relative z-10 flex items-center gap-2">
            <Send size={18} /> Announcement Broadcaster
          </h3>
          <p className="text-xs text-zinc-500 mb-6 relative z-10">Push an instant notification to all employee dashboards.</p>
          
          <form onSubmit={handleBroadcast} className="flex flex-col flex-1 relative z-10">
            <textarea 
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g., 'Emergency all-hands meeting in 10 minutes. Please join the main voice channel.'"
              className="flex-1 w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all mb-4"
            />
            <button 
              type="submit"
              disabled={sent || !announcement.trim()}
              className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                sent 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {sent ? <><CheckCircle size={16} /> Broadcast Sent</> : <><Send size={16} /> Broadcast to All</>}
            </button>
          </form>
        </div>

        {/* Role-Based Access Control */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 relative z-10 flex items-center gap-2">
            <Key size={18} /> Role-Based Access Control (RBAC)
          </h3>
          <p className="text-xs text-zinc-500 mb-6 relative z-10">Manage permissions and view visibility for roles.</p>
          
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 relative z-10 hide-scrollbar">
            
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2"><Users size={14}/> Developer Role</h4>
                <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div></div>
              </div>
              <div className="flex flex-col gap-2 text-xs font-medium text-zinc-500">
                <label className="flex items-center gap-2"><input type="checkbox" checked readOnly className="accent-indigo-500" /> View Project Kanban</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked readOnly className="accent-indigo-500" /> View Own Time Tracker</label>
                <label className="flex items-center gap-2"><input type="checkbox" readOnly className="accent-indigo-500" /> View Team Time Tracker</label>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2"><Users size={14}/> Intern Role</h4>
                <div className="w-10 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5"></div></div>
              </div>
              <div className="flex flex-col gap-2 text-xs font-medium text-zinc-500">
                <label className="flex items-center gap-2"><input type="checkbox" checked readOnly className="accent-indigo-500" /> View Project Kanban (Read-Only)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked readOnly className="accent-indigo-500" /> View Own Time Tracker</label>
                <label className="flex items-center gap-2"><input type="checkbox" readOnly className="accent-indigo-500" /> View Client CRM</label>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-rose-200/50 dark:border-rose-900/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle size={14} /> <h4 className="font-bold text-sm">Strict Visibility Enforced</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">Financials, Profitability Calculators, and Client LTV are globally locked to the Executive Admin role. No other roles can be granted access.</p>
            </div>

          </div>
        </div>

        {/* Maintenance Mode Controller */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative overflow-hidden lg:col-span-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 relative z-10 flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-500" /> Maintenance Mode Control
          </h3>
          <p className="text-xs text-zinc-500 mb-6 relative z-10">Toggle maintenance mode for dev.mkavs.com or schedule it for a future time. This will lock out standard users.</p>
          
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-1 flex flex-col gap-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white block">Enable Maintenance Mode</span>
                  <span className="text-xs text-zinc-500">Instantly take down the public site with a maintenance screen.</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${maintenanceConfig.enabled ? 'bg-rose-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <input type="checkbox" className="sr-only" checked={maintenanceConfig.enabled} onChange={(e) => setMaintenanceConfig({...maintenanceConfig, enabled: e.target.checked})} />
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${maintenanceConfig.enabled ? 'right-1' : 'left-1'}`}></div>
                </div>
              </label>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scheduled Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={maintenanceConfig.scheduledFor || ''} 
                  onChange={(e) => setMaintenanceConfig({...maintenanceConfig, scheduledFor: e.target.value})}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
               <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Maintenance Message</label>
                <textarea 
                  value={maintenanceConfig.message}
                  onChange={(e) => setMaintenanceConfig({...maintenanceConfig, message: e.target.value})}
                  placeholder="e.g. We are currently upgrading our servers..."
                  className="w-full flex-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                />
              </div>
              <button 
                onClick={handleSaveMaintenance}
                disabled={isSaving}
                className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  isSaving ? 'bg-zinc-400 text-white cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                }`}
              >
                <AlertCircle size={16} /> {isSaving ? 'Saving...' : 'Apply Maintenance Settings'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
