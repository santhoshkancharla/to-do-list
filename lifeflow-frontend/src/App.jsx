import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Flame, 
  Moon, 
  Sun, 
  Timer, 
  User as UserIcon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Pages & Components (will be created next)
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Goals from './pages/Goals';
import CalendarView from './pages/CalendarView';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Pomodoro from './components/Pomodoro';

import { api, setToken } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [streakUpdated, setStreakUpdated] = useState(false);

  // Load auth state and theme
  useEffect(() => {
    const initApp = async () => {
      const savedTheme = localStorage.getItem('lifeflow_theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Check if we have a locally cached user for instant snappiness
      const cachedUser = JSON.parse(localStorage.getItem('lifeflow_user') || 'null');
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);

        // Validate the token in the background
        api.auth.me().then((currentUser) => {
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token has expired or is invalid, log out
            handleLogout();
          }
        }).catch(() => {
          // If offline/timeout, keep using the cached user details in offline mode
        });
      } else {
        // No cached user, attempt to fetch current user session (e.g. if token exists but user cache was cleared)
        try {
          const currentUser = await api.auth.me();
          if (currentUser) {
            setUser(currentUser);
          }
        } catch (err) {
          // Fallback to login screen
        }
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Theme Toggle
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('lifeflow_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
    // Animate streak indicator on success login
    setStreakUpdated(true);
    setTimeout(() => setStreakUpdated(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <Sparkles className="absolute h-8 w-8 animate-pulse text-violet-400" />
        </div>
      </div>
    );
  }

  // Define sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Daily Planner', icon: CheckSquare },
    { id: 'goals', label: 'Goals & Milestones', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notes', label: 'Notes Notepad', icon: BookOpen },
    { id: 'analytics', label: 'Productivity Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Render current tab/page page component
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} setPage={setCurrentPage} />;
      case 'planner':
        return <Planner user={user} />;
      case 'goals':
        return <Goals user={user} />;
      case 'calendar':
        return <CalendarView user={user} />;
      case 'notes':
        return <Notes user={user} />;
      case 'analytics':
        return <Analytics user={user} />;
      case 'settings':
        return <Settings user={user} setUser={setUser} handleLogout={handleLogout} />;
      default:
        return <Dashboard user={user} setPage={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Dynamic Glowing Blobs for Flashy Aesthetics */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] animate-blob rounded-full bg-glow-purple opacity-70 blur-[100px] transition-transform duration-1000"></div>
        <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] animate-blob rounded-full bg-glow-indigo opacity-50 blur-[120px] animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] animate-blob rounded-full bg-glow-rose opacity-40 blur-[140px] animation-delay-4000"></div>
      </div>

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen items-center justify-center p-4"
          >
            <Auth onAuthSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          <div key="app" className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
            <motion.aside 
              animate={{ width: isSidebarOpen ? 280 : 80 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="relative hidden h-full flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl md:flex z-20"
            >
              {/* Logo / Header */}
              <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/80">
                {isSidebarOpen ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-neon-violet">
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <span className="font-display text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-violet-600 dark:from-white dark:via-slate-100 dark:to-violet-400 bg-clip-text text-transparent">LifeFlow</span>
                  </motion.div>
                ) : (
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-neon-violet">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' 
                          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 group-hover:text-violet-500 transition-colors'}`} />
                      {isSidebarOpen && <span>{item.label}</span>}
                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator" 
                          className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-violet-500"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium text-rose-400/90 hover:bg-rose-500/10 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  {isSidebarOpen && <span>Logout</span>}
                </button>
              </div>
            </motion.aside>

            {/* Mobile Sidebar Overlay Drawer */}
            <AnimatePresence>
              {!isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                />
              )}
            </AnimatePresence>
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: isSidebarOpen ? -280 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-slate-900 border-r border-slate-800 z-40 md:hidden flex flex-col"
            >
              <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-display text-xl font-bold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">LifeFlow</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20' 
                          : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>

            {/* Main Workspace Frame */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <header className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                  </button>
                  <h1 className="font-display text-xl font-bold hidden sm:block text-slate-800 dark:text-slate-100">
                    {navItems.find(n => n.id === currentPage)?.label}
                  </h1>
                </div>

                {/* Right utility items */}
                <div className="flex items-center gap-4">
                  
                  {/* Focus Timer Trigger */}
                  <button
                    onClick={() => setIsPomodoroOpen(!isPomodoroOpen)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                      isPomodoroOpen 
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-600 dark:text-violet-400' 
                        : 'border-slate-200 hover:border-slate-300 bg-white/40 text-slate-650 hover:text-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                  >
                    <Timer className="h-4.5 w-4.5 animate-pulse-slow text-violet-400" />
                    <span className="hidden md:inline">Focus Timer</span>
                  </button>

                  {/* Daily Streak Counter with dynamic fire effect */}
                  <motion.div 
                    animate={streakUpdated ? { scale: [1, 1.25, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3.5 py-2 text-orange-400 text-sm font-semibold shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                  >
                    <Flame className="h-4.5 w-4.5 animate-bounce text-orange-500" />
                    <span>{user.streak || 1} Day Streak</span>
                  </motion.div>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors text-slate-500 dark:text-slate-300"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
                  </button>

                  {/* Profile Indicator */}
                  <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                      {user.username ? user.username[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium hidden md:inline text-slate-600 dark:text-slate-300">{user.username}</span>
                  </div>
                </div>
              </header>

              {/* Viewport for Active Tab */}
              <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="h-full"
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Pomodoro Timer Slide-in Pane */}
            <AnimatePresence>
              {isPomodoroOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsPomodoroOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                  />
                  {/* Floating Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-6 top-24 bottom-6 w-96 max-w-full z-50 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-2xl"
                  >
                    <div className="flex items-center justify-between p-6 border-b border-slate-850">
                      <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
                        <Timer className="h-5 w-5 text-violet-400 animate-pulse" /> Focus Center
                      </h3>
                      <button 
                        onClick={() => setIsPomodoroOpen(false)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6 h-[calc(100%-76px)] overflow-y-auto">
                      <Pomodoro />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
