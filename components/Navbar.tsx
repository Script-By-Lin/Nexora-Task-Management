'use client';

import React, { useState } from 'react';

interface NavbarProps {
  currentView: 'today' | 'all' | 'calendar';
  setView: (view: 'today' | 'all' | 'calendar') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  taskStats: {
    total: number;
    pending: number;
    completed: number;
  };
}

export default function Navbar({
  currentView,
  setView,
  searchQuery,
  setSearchQuery,
  isDarkMode,
  toggleDarkMode,
  taskStats,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'today' as const,
      label: 'Today',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'all' as const,
      label: 'All Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'calendar' as const,
      label: 'Calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (view: 'today' | 'all' | 'calendar') => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = ({ showBrand = true }: { showBrand?: boolean }) => (
    <div className="flex flex-col h-full justify-between">
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        {showBrand && (
          <div className="flex flex-col px-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Nexora
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Daily Personal Planner</p>
          </div>
        )}

        {/* Global Search */}
        <div className="relative px-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 dark:bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Stats + Dark Mode Toggle */}
      <div className="flex flex-col gap-4 border-t border-border pt-6 mt-6">
        {/* Stats Panel */}
        <div className="bg-muted/40 dark:bg-muted/10 rounded-2xl p-4 border border-border/50">
          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Progress</span>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">{taskStats.pending}</span>
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
            <div className="flex flex-col border-l border-border/50 pl-3">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{taskStats.completed}</span>
              <span className="text-[10px] text-muted-foreground">Completed</span>
            </div>
          </div>
          <div className="mt-3.5 h-1.5 bg-muted dark:bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40 hover:border-border transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <>
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>Dark Mode</span>
              </>
            )}
          </div>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
            <div className={`w-3 h-3 rounded-full bg-card transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border h-screen sticky top-0 bg-card p-6 shadow-sm z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Navigation */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Nexora</h1>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted focus:outline-none cursor-pointer"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-80 bg-card p-6 border-r border-border z-50 shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-border/50">
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-lg">Nexora</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent showBrand={false} />
      </div>
    </>
  );
}
