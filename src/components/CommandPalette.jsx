import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Clock, Plus, Zap, Settings, User, LogOut, Kanban, Ticket as TicketIcon } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onAction, activeView }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'project', label: 'Go to Project Manager', icon: <Kanban size={16} />, category: 'Navigation' },
    { id: 'tickets', label: 'View Approval Tickets', icon: <TicketIcon size={16} />, category: 'Navigation' },
    { id: 'time', label: 'Track My Time', icon: <Clock size={16} />, category: 'Navigation' },
    { id: 'crm', label: 'Manage Clients (CRM)', icon: <User size={16} />, category: 'Navigation' },
    { id: 'new_project', label: 'Create New Project', icon: <Plus size={16} />, category: 'Actions' },
    { id: 'toggle_timer', label: 'Start/Stop Timer', icon: <Zap size={16} />, category: 'Actions' },
    { id: 'logout', label: 'Logout from System', icon: <LogOut size={16} />, category: 'System' },
  ];

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      if (filteredActions[selectedIndex]) {
        onAction(filteredActions[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filteredActions, selectedIndex, onAction, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/40 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#e1e4e8] overflow-hidden relative z-10"
      >
        <div className="flex items-center px-4 border-b border-[#e1e4e8]">
          <Search size={18} className="text-[#6a737d]" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, views, and actions..."
            className="w-full py-4 px-3 text-sm focus:outline-none bg-transparent placeholder-[#6a737d]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 bg-[#f3f4f6] px-1.5 py-0.5 rounded border border-[#e1e4e8]">
            <span className="text-[10px] font-bold text-[#6a737d]">ESC</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#6a737d]">No results found for "{query}"</p>
            </div>
          ) : (
            <div>
              {['Navigation', 'Actions', 'System'].map(category => {
                const categoryActions = filteredActions.filter(a => a.category === category);
                if (categoryActions.length === 0) return null;
                
                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <p className="px-3 py-2 text-[10px] font-bold text-[#6a737d] uppercase tracking-widest">{category}</p>
                    {categoryActions.map((action, idx) => {
                      const absoluteIdx = filteredActions.indexOf(action);
                      const isSelected = selectedIndex === absoluteIdx;
                      
                      return (
                        <div
                          key={action.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[#1a1a1b] text-white shadow-lg' : 'hover:bg-[#f3f4f6] text-[#1a1a1b]'}`}
                          onClick={() => {
                            onAction(action.id);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                        >
                          <div className={`${isSelected ? 'text-white' : 'text-[#6a737d]'}`}>
                            {action.icon}
                          </div>
                          <span className="flex-1 text-sm font-medium">{action.label}</span>
                          {isSelected && <Command size={14} className="opacity-50" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-[#f9f9fb] border-t border-[#e1e4e8] flex items-center justify-between text-[10px] text-[#6a737d] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="px-1 py-0.5 border border-[#e1e4e8] rounded bg-white">↑↓</span> to navigate</span>
            <span className="flex items-center gap-1.5"><span className="px-1 py-0.5 border border-[#e1e4e8] rounded bg-white">ENTER</span> to select</span>
          </div>
          <span>MKavs Command Palette</span>
        </div>
      </motion.div>
    </div>
  );
}
