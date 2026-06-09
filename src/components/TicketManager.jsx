import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  History,
  Check,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { EmptyState } from './ui/EmptyState';

export default function TicketManager({ user, onReview }) {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (e) {
      console.error("Failed to fetch tickets", e);
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReview = async (id, status) => {
    if (!decisionComment && status === 'rejected') {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status, decisionComment })
      });

      if (res.ok) {
        setDecisionComment('');
        setSelectedTicket(null);
        fetchTickets();
        if (onReview) onReview();
      } else {
        const errorData = await res.json();
        alert(`Review failed: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("Review failed", e);
      alert("Network error: Could not connect to the server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTickets = Array.isArray(tickets) ? tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = (t.employeeName || '').toLowerCase().includes(search.toLowerCase()) || 
                         (t.ticketNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                         (t.projectName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }) : [];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning-tint text-warning border-warning/20';
      case 'approved': return 'bg-success-tint text-success border-success/20';
      case 'rejected': return 'bg-danger-tint text-danger border-danger/20';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Approval Tickets</h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Manage manual time entry requests</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Tickets List */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ticket</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Project</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {filteredTickets.map(ticket => (
                  <tr 
                    key={ticket._id} 
                    className={`group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer ${selectedTicket?._id === ticket._id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{ticket.ticketNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                          {ticket.employeeName.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{ticket.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{ticket.projectName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{(ticket.requestedMinutes / 60).toFixed(1)} hrs</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={18} className={`text-zinc-300 transition-transform ${selectedTicket?._id === ticket._id ? 'translate-x-1 text-primary' : ''}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTickets.length === 0 && (
              <EmptyState 
                icon={Ticket}
                title="No tickets found"
                subtitle="Try adjusting your filters or search query"
              />
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col sticky top-8 h-fit">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div 
                key={selectedTicket._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <p className="text-xs font-bold text-zinc-400">{selectedTicket.ticketNumber}</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xl">
                      {selectedTicket.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedTicket.employeeName}</h4>
                      <p className="text-xs font-medium text-zinc-500">{selectedTicket.requesterEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-6 border-y border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Project</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedTicket.projectName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Requested Time</p>
                      <p className="text-sm font-bold text-success">+{(selectedTicket.requestedMinutes / 60).toFixed(1)} hrs</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date of Work</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(selectedTicket.entryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Submitted</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Reason for Manual Entry</p>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                        "{selectedTicket.reason}"
                      </p>
                    </div>
                  </div>

                  {selectedTicket.status === 'pending' && user.isExecutive && (
                    <div className="space-y-4 pt-4">
                      <textarea 
                        value={decisionComment}
                        onChange={(e) => setDecisionComment(e.target.value)}
                        placeholder="Add a comment or reason for rejection..."
                        className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleReview(selectedTicket._id, 'rejected')}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-danger-tint text-danger hover:bg-danger/10 border border-danger/20 text-xs font-bold transition-all"
                        >
                          <X size={16} /> Reject
                        </button>
                        <button 
                          onClick={() => handleReview(selectedTicket._id, 'approved')}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-white hover:bg-success/80 shadow-lg shadow-success/20 text-xs font-bold transition-all"
                        >
                          <Check size={16} /> Approve
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status !== 'pending' && selectedTicket.decisionComment && (
                    <div className="pt-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Decision Note</p>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        {selectedTicket.decisionComment}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-2 text-right">— Reviewed by {selectedTicket.approverName}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState 
                  icon={Ticket}
                  title="Select a ticket"
                  subtitle="Choose a ticket to view details and actions"
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
