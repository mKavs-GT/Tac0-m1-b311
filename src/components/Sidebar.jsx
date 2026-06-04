import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Kanban, 
  Clock, 
  Users, 
  Database, 
  Shield, 
  LogOut, 
  Ticket as TicketIcon, 
  TrendingUp, 
  Info, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Download,
  CalendarCheck
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const kaironIcon = '/kairon-icon.png';

const NavItem = ({ icon, label, active, onClick, collapsed, badge }) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center ${collapsed ? 'justify-center w-11 h-11' : 'gap-3 w-full px-3 py-2.5 h-11'} rounded-xl text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-accent/10 text-accent' 
        : 'text-text-secondary hover:bg-bg-muted hover:text-text-main border border-transparent'
    }`}
  >
    <div className={`flex items-center justify-center flex-shrink-0 transition-colors`}>
      {icon}
    </div>
    
    {!collapsed && (
      <motion.span 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="truncate flex-1 text-left"
      >
        {label}
      </motion.span>
    )}

    {badge && !collapsed && (
      <span className="px-1.5 py-0.5 rounded-full bg-accent text-bg-root text-[10px] font-bold">
        {badge}
      </span>
    )}

    {collapsed && (
      <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-bg-surface text-text-main text-xs font-semibold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm border border-border-main">
        {label}
      </div>
    )}
  </button>
);

const NavSection = ({ title, children, collapsed }) => (
  <div className="space-y-1">
    {!collapsed && (
      <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
        {title}
      </p>
    )}
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

export default function Sidebar({ 
  user, 
  activeView, 
  setActiveView, 
  isDarkMode, 
  isLiveOnChatbot, 
  handleLogout,
  isOpen, // Mobile drawer state
  setIsOpen,
  isCollapsed, // Desktop/Tablet collapsed state
  setIsCollapsed
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWA();
  
  // State for pinned (layout) width vs visual (hover) width
  const visualCollapsed = isCollapsed && !isHovered;
  
  const layoutWidth = isCollapsed ? '64px' : '240px';
  const visualWidth = visualCollapsed ? '64px' : '240px';

  const navContent = (collapsed) => (
    <>
      <NavSection title="Dashboard" collapsed={collapsed}>
        <NavItem 
          icon={<TrendingUp size={20} />} 
          label="Mission Control" 
          active={activeView === 'analytics'} 
          onClick={() => { setActiveView('analytics'); setIsOpen(false); }} 
          collapsed={collapsed}
        />
        <NavItem 
          icon={<Kanban size={20} />} 
          label="Active Sprints" 
          active={activeView === 'project'} 
          onClick={() => { setActiveView('project'); setIsOpen(false); }} 
          collapsed={collapsed}
        />
        {(user?.isExecutive || user?.isManager) && (
          <NavItem 
            icon={<TicketIcon size={20} />} 
            label="Approvals" 
            active={activeView === 'tickets'} 
            onClick={() => { setActiveView('tickets'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
      </NavSection>

      <NavSection title="Monitor" collapsed={collapsed}>
        <NavItem 
          icon={<Clock size={20} />} 
          label="Live Presence" 
          active={activeView === 'time'} 
          onClick={() => { setActiveView('time'); setIsOpen(false); }} 
          collapsed={collapsed}
        />
        <NavItem 
          icon={<CalendarCheck size={20} />} 
          label="Attendance" 
          active={activeView === 'attendance'} 
          onClick={() => { setActiveView('attendance'); setIsOpen(false); }} 
          collapsed={collapsed}
        />
        {(user?.isExecutive || user?.isManager) && (
          <NavItem 
            icon={<Users size={20} />} 
            label="Team Hub" 
            active={activeView === 'team'} 
            onClick={() => { setActiveView('team'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
        {user?.isExecutive && (
          <NavItem 
            icon={<Info size={20} />} 
            label="Logs" 
            active={activeView === 'logs'} 
            onClick={() => { setActiveView('logs'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
      </NavSection>

      <NavSection title="Manage" collapsed={collapsed}>
        {(user?.isExecutive || user?.isManager) && (
          <NavItem 
            icon={<Database size={20} />} 
            label="Clients" 
            active={activeView === 'crm'} 
            onClick={() => { setActiveView('crm'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
        {user?.isExecutive && (
          <NavItem 
            icon={<Briefcase size={20} />} 
            label="Vault" 
            active={activeView === 'vault'} 
            onClick={() => { setActiveView('vault'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
        <NavItem 
          icon={
            <div className="relative">
              <img src={kaironIcon} alt="" className="w-5 h-5" />
              {isLiveOnChatbot && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-bg-surface"></div>
              )}
            </div>
          } 
          label="Kairon AI" 
          active={activeView === 'kairon'} 
          onClick={() => { setActiveView('kairon'); setIsOpen(false); }} 
          collapsed={collapsed}
        />
        {user?.isExecutive && (
          <NavItem 
            icon={<Shield size={20} className="text-rose-600" />} 
            label="God Mode" 
            active={activeView === 'godmode'} 
            onClick={() => { setActiveView('godmode'); setIsOpen(false); }} 
            collapsed={collapsed}
          />
        )}
      </NavSection>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Layout Wrapper */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden md:block flex-shrink-0 transition-all duration-300 sticky top-0 h-screen z-[70]"
        style={{ width: layoutWidth }}
      >
        <motion.div
          initial={false}
          animate={{ width: visualWidth }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className={`absolute top-0 left-0 bottom-0 flex flex-col bg-bg-surface border-r border-border-main h-screen overflow-hidden transition-shadow duration-300 ${
            isHovered && isCollapsed ? 'shadow-2xl ring-1 ring-black/5' : ''
          }`}
        >
          {/* Workspace Switcher / Logo */}
          <div className="p-4 border-b border-border-main flex items-center justify-between min-h-[64px] relative group/header">
            <div className={`flex items-center transition-all duration-300 ${visualCollapsed ? 'justify-center w-full' : 'gap-3 px-2'}`}>
              <div className="text-accent font-bold text-[20px] leading-none tracking-tighter">mK</div>
            </div>
            
            {/* Collapse Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden lg:flex p-1 rounded-md hover:bg-bg-muted text-text-muted hover:text-text-main transition-all border border-transparent hover:border-border-main ${visualCollapsed ? 'absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/header:opacity-100' : ''}`}
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-8 no-scrollbar scroll-smooth">
            {navContent(visualCollapsed)}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border-main space-y-2">
            <div className={`flex items-center ${visualCollapsed ? 'justify-center' : 'gap-3 px-3 py-2'} mb-2`}>
              <div className="relative">
                <img src={user?.avatar || '/default-avatar.png'} className="w-8 h-8 rounded-full object-cover border border-border-main" alt="" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-bg-surface"></div>
              </div>
              {!visualCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{user?.name || 'User'}</p>
                </div>
              )}
            </div>

            {isInstallable && !isInstalled && (
              <NavItem 
                icon={<Download size={20} className="text-accent" />} 
                label="Install App" 
                onClick={installApp} 
                collapsed={visualCollapsed}
              />
            )}
            <NavItem 
              icon={<LogOut size={20} />} 
              label="Logout" 
              onClick={handleLogout} 
              collapsed={visualCollapsed}
            />
          </div>
        </motion.div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <div className="md:hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-bg-surface z-[80] shadow-2xl flex flex-col border-r border-border-main"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-border-main flex items-center justify-between min-h-[64px]">
                <div className="flex items-center gap-3">
                  <img src="/LOGOI.png" className="w-8 h-8 object-contain" alt="" />
                  <div className="flex flex-col">
                    <img src="/MKAVS.png" className={`h-4 object-contain ${isDarkMode ? 'invert' : ''}`} alt="MKAVS" />
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-tight">Enterprise</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-bg-muted rounded-lg text-text-muted">
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-8">
                {navContent(false)}
              </nav>

              <div className="p-4 border-t border-border-main space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="relative">
                    <img src={user?.avatar || '/default-avatar.png'} className="w-8 h-8 rounded-full object-cover border border-border-main" alt="" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-bg-surface"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{user?.name || 'User'}</p>
                  </div>
                </div>
                {isInstallable && !isInstalled && (
                  <NavItem 
                    icon={<Download size={20} className="text-accent" />} 
                    label="Install App" 
                    onClick={installApp} 
                    collapsed={false}
                  />
                )}
                <NavItem 
                  icon={<LogOut size={20} />} 
                  label="Logout" 
                  onClick={handleLogout} 
                  collapsed={false}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
