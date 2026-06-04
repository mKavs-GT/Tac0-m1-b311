import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, AlertCircle, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Real weekly data will be calculated from the history state

export default function TimeTracker({ user, onTicketSubmit, completedTodaySeconds, currentSessionSeconds, completedMonthSeconds }) {
  const [view, setView] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date()); 
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const [stats, setStats] = useState({ completedTodaySeconds: 0, completedMonthSeconds: 0 });
  const [history, setHistory] = useState({ dailyLogs: {} });
  const [manualEntry, setManualEntry] = useState({ hours: '', projectName: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const formatDuration = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return '00:00:00';
    const absSeconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/time-entries/stats`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data && typeof data === 'object') {
        setStats(data);
      }
    } catch (e) { console.error("Stats fetch fail", e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/time-entries/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data && typeof data === 'object') {
        setHistory(data);
      }
    } catch (e) { console.error("History fetch fail", e); }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();

    const handleRefresh = () => {
      fetchStats();
      fetchHistory();
    };

    // Auto-refresh stats every 60 seconds to show progress if timer is running
    const interval = setInterval(fetchStats, 60000);

    window.addEventListener('mkavs-timer-stopped', handleRefresh);
    return () => {
      window.removeEventListener('mkavs-timer-stopped', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeek = [];
    const today = new Date();
    
    // Get start of week (Sunday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = history.dailyLogs && history.dailyLogs[dateStr];
      const hours = log ? log.totalMinutes / 60 : 0;
      
      currentWeek.push({
        name: days[i],
        hours: parseFloat(hours.toFixed(1)),
        fullDate: dateStr
      });
    }
    return currentWeek;
  };

  const weeklyData = getWeeklyData();
  
  const handleManualSubmit = async () => {
    if (!manualEntry.hours || !manualEntry.projectName || !manualEntry.reason) {
      alert("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const entryDate = new Date(selectedDate);

      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          projectId: manualEntry.projectName, // Using name as ID for simplicity
          projectName: manualEntry.projectName,
          entryDate,
          requestedMinutes: parseFloat(manualEntry.hours) * 60,
          reason: manualEntry.reason
        })
      });

      if (res.ok) {
        setWasSubmitted(true);
        setTimeout(() => {
          setWasSubmitted(false);
          setShowManualEntry(false);
          setManualEntry({ hours: '', projectName: '', reason: '' });
        }, 3000);
        
        if (onTicketSubmit) onTicketSubmit();
      } else {
        const errorData = await res.json();
        alert(`Submission failed: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("Submission failed", e);
      alert("Network error: Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChartData = () => {
    const data = [];
    const baseDate = new Date(selectedDate);
    
    if (view === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Get start of week (Sunday)
      const sunday = new Date(baseDate);
      sunday.setDate(baseDate.getDate() - baseDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const hours = history.dailyLogs && history.dailyLogs[dStr] ? history.dailyLogs[dStr] : 0;
        data.push({ name: days[i], hours: parseFloat(Number(hours).toFixed(2)) });
      }
    } else if (view === 'monthly') {
      // Group by weeks or 5-day blocks for monthly view
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i += 5) {
        let blockHours = 0;
        for (let j = 0; j < 5 && (i + j) <= daysInMonth; j++) {
          const d = new Date(year, month, i + j);
          const dStr = d.toISOString().split('T')[0];
          blockHours += (history.dailyLogs && history.dailyLogs[dStr]) ? history.dailyLogs[dStr] : 0;
        }
        data.push({ name: `${i}-${Math.min(i+4, daysInMonth)}`, hours: parseFloat(blockHours.toFixed(2)) });
      }
    } else {
      // Yearly - group by months
      const year = baseDate.getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        let monthHours = 0;
        const daysInM = new Date(year, i + 1, 0).getDate();
        for (let j = 1; j <= daysInM; j++) {
          const d = new Date(year, i, j);
          const dStr = d.toISOString().split('T')[0];
          monthHours += (history.dailyLogs && history.dailyLogs[dStr]) ? history.dailyLogs[dStr] : 0;
        }
        data.push({ name: months[i], hours: parseFloat(monthHours.toFixed(1)) });
      }
    }
    return data;
  };

  const displayChartData = getChartData();

  // Generate heatmap data
  const getHeatmapColor = (hours) => {
    if (hours === 0) return 'bg-zinc-100 dark:bg-zinc-800/50';
    if (hours < 3) return 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100';
    if (hours < 6) return 'bg-emerald-400 dark:bg-emerald-700/60 text-white';
    if (hours < 9) return 'bg-emerald-500 dark:bg-emerald-500 text-white shadow-sm';
    return 'bg-emerald-600 dark:bg-emerald-400 text-white shadow-md';
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 flex flex-col gap-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute -bottom-4 -right-4 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all text-indigo-500 duration-500">
               <CalendarIcon size={120} />
             </div>
             <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 relative z-10">Total Today</p>
             <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10 font-mono">
               {formatDuration(completedTodaySeconds + currentSessionSeconds)}
             </p>
          </div>
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
             <div className="absolute -bottom-4 -right-4 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all text-purple-500 duration-500">
               <Clock size={120} />
             </div>
             <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 relative z-10">Monthly Total</p>
             <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10 font-mono">
               {formatDuration(completedMonthSeconds + currentSessionSeconds)}
             </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex-1 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Working Hours</h2>
            <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
              {['weekly', 'monthly', 'yearly'].map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    view === v 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 relative -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 13, fontWeight: 500 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 13, fontWeight: 500 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }}
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }} 
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="hours" radius={[8, 8, 8, 8]} fill="url(#colorUv)" barSize={48} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column - Calendar Heatmap & Manual Entry */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Productivity Heatmap</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const d = new Date(viewDate);
                d.setMonth(d.getMonth() - 1);
                setViewDate(d);
              }}
              aria-label="Previous Month"
              className="p-2 rounded-xl hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors border border-transparent hover:border-zinc-200 dark:border-zinc-700/50 dark:hover:border-zinc-700"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => {
                const d = new Date(viewDate);
                d.setMonth(d.getMonth() + 1);
                setViewDate(d);
              }}
              aria-label="Next Month"
              className="p-2 rounded-xl hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors border border-transparent hover:border-zinc-200 dark:border-zinc-700/50 dark:hover:border-zinc-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center mb-6">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <div key={i} className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{d}</div>
          ))}
          {(() => {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            today.setHours(0,0,0,0);

            const grid = [];
            // Padding
            for (let i = 0; i < firstDayOfMonth; i++) {
              grid.push(<div key={`pad-${i}`} className="aspect-square"></div>);
            }
            
            for (let d = 1; d <= daysInMonth; d++) {
              const dateObj = new Date(year, month, d);
              const dateStr = dateObj.toISOString().split('T')[0];
              const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isFuture = dateObj > today;
              const hoursLogged = (history?.dailyLogs?.[dateStr]) || 0;
              const heatColor = isFuture ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700/50 cursor-not-allowed border border-dashed border-zinc-200 dark:border-zinc-800' : getHeatmapColor(hoursLogged);

              grid.push(
                <button
                  key={d}
                  onClick={() => !isFuture && setSelectedDate(new Date(year, month, d))}
                  disabled={isFuture}
                  className={`aspect-square rounded-[10px] flex items-center justify-center text-xs font-bold transition-all duration-300 ${heatColor} ${
                    isSelected && !isFuture ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-zinc-900 scale-110 z-10 shadow-lg' : 'hover:scale-105'
                  }`}
                  title={`${d} ${dateObj.toLocaleString('default', { month: 'short' })}: ${hoursLogged.toFixed(1)} hours`}
                >
                  {d}
                </button>
              );
            }
            return grid;
          })()}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mb-8">
          <span className="text-[10px] font-semibold text-zinc-500 mr-1">Less</span>
          <div className="w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800/50"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400"></div>
          <span className="text-[10px] font-semibold text-zinc-500 ml-1">More</span>
        </div>

        {/* Actions & Selected Day info */}
        <div className="mt-auto flex flex-col gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Hours on {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter font-mono">
                {(() => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  if (dateStr === todayStr) {
                    return formatDuration(completedTodaySeconds + currentSessionSeconds);
                  }
                  // History logs are decimal hours, convert to seconds
                  const decimalHours = history?.dailyLogs?.[dateStr] || 0;
                  return formatDuration(Math.round(decimalHours * 3600));
                })()}
              </p>
            </div>
            <button 
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Manual Entry"
              aria-label="Manual Entry"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Manual Entry Form */}
          <AnimatePresence>
            {showManualEntry && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mt-1">
                  <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-500">
                    <AlertCircle size={16} />
                    <p className="text-xs font-bold uppercase tracking-wider">Manual Entry</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={manualEntry.hours}
                        onChange={(e) => setManualEntry({...manualEntry, hours: e.target.value})}
                        placeholder="Hours" 
                        className="w-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      />
                      <input 
                        type="text" 
                        value={manualEntry.projectName}
                        onChange={(e) => setManualEntry({...manualEntry, projectName: e.target.value})}
                        placeholder="Project Name" 
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      />
                    </div>
                    <textarea 
                      value={manualEntry.reason}
                      onChange={(e) => setManualEntry({...manualEntry, reason: e.target.value})}
                      placeholder="Reason for manual entry..." 
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[60px]"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">*Requires Admin Approval</span>
                    <button 
                      onClick={handleManualSubmit}
                      disabled={isSubmitting || wasSubmitted}
                      className={`${
                        wasSubmitted 
                          ? 'bg-emerald-500 hover:bg-emerald-600' 
                          : 'bg-amber-500 hover:bg-amber-600'
                      } disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2`}
                    >
                      {isSubmitting ? 'Submitting...' : wasSubmitted ? <><Check size={14}/> Submitted</> : 'Submit Request'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
