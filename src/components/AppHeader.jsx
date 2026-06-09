import React from 'react';
import { Menu, Search, Sun, Moon, Bell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function AppHeader({ 
  user, 
  activeView, 
  getViewTitle, 
  isDarkMode, 
  setIsDarkMode, 
  setIsMobileMenuOpen,
  setIsCommandPaletteOpen
}) {
  return (
    <header className="h-[60px] bg-bg-surface border-b border-border-main flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          aria-label="Open Mobile Menu"
          className="lg:hidden p-2 hover:bg-bg-muted rounded-lg text-text-muted transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 flex justify-center">
        {/* Search Bar - Hidden on small mobile */}
        <div 
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center w-full max-w-md relative cursor-pointer group"
        >
          <Search size={16} className="absolute left-4 text-text-muted group-hover:text-text-main transition-colors" />
          <div className="w-full bg-bg-muted rounded-full py-2 pl-10 pr-4 text-sm transition-all text-text-muted">
            ⌘K Search...
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-3">
         {/* Theme Toggle */}
         <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Theme"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-muted transition-colors text-text-muted hover:text-text-main"
            title="Toggle Theme"
         >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
         </button>

         {/* Bell Icon */}
         <div className="relative flex items-center justify-center">
           <NotificationCenter user={user} />
           <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-bg-surface"></div>
         </div>

         {/* User Profile */}
         <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity ml-1 p-1 rounded-lg hover:bg-bg-muted">
           <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-muted">
             <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
              alt={user.name} 
              className="w-full h-full object-cover" 
            />
           </div>
           <span className="text-sm font-medium text-text-main hidden md:block pr-1">{user?.firstName || user?.name || 'User'}</span>
         </div>
      </div>
    </header>
  );
}
