import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  ArrowRight,
  Clock,
  RefreshCw,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';

const MOTIVATIONAL_QUOTES = [
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Flow is the state of optimal experience. When you are in flow, you lose yourself in what you do.", author: "Mihaly Csikszentmihalyi" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
];

export default function Dashboard({ user, setPage }) {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [events, setEvents] = useState([]);
  const [habits, setHabits] = useState([]);
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, goalsRes, eventsRes, habitsRes] = await Promise.all([
          api.tasks.getAll(),
          api.goals.getAll(),
          api.events.getAll(),
          api.habits.getAll()
        ]);
        setTasks(tasksRes);
        setGoals(goalsRes);
        setEvents(eventsRes);
        setHabits(habitsRes);
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    rotateQuote();
  }, []);

  const rotateQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  };

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Today's tasks
  const todayTasks = tasks.filter(t => t.dueDate === todayStr || (!t.dueDate && !t.isCompleted));
  const completedTodayTasks = todayTasks.filter(t => t.isCompleted);
  const taskCompletionRate = todayTasks.length > 0 
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
    : 0;

  // Goals
  const pendingGoals = goals.filter(g => g.status !== 'completed');
  
  // Upcoming events / deadlines
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date(todayStr))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Habits completed today
  const habitsCompletedToday = habits.filter(h => h.completedDates && h.completedDates.includes(todayStr));

  // Containers animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Top Banner Greeting */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl glass border border-slate-800/80 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent -z-10"></div>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-extrabold text-white flex items-center gap-2">
            Hey, {user.username}! <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            You are doing amazing. Let's conquer your productivity goals today!
          </p>
        </div>

        {/* Dynamic Streak Display */}
        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="h-7 w-7 text-orange-500 animate-bounce" />
          </div>
          <div>
            <div className="text-orange-400 font-extrabold text-lg flex items-center gap-1">
              <span>{user.streak || 1} Days</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">Record Max: {user.maxStreak || 1} Days</p>
          </div>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Task Completion Radial */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center h-28 w-28 mb-4">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-slate-800 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-violet-500 fill-none transition-all duration-1000"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - taskCompletionRate / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-bold font-display text-white">{taskCompletionRate}%</span>
          </div>
          <h3 className="font-display font-bold text-white text-base">Today's Tasks</h3>
          <p className="text-xs text-slate-400 mt-1">
            {completedTodayTasks.length} of {todayTasks.length} Completed
          </p>
        </div>

        {/* Goal Progress Tracker */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 font-bold">Goal Targets</span>
          </div>
          <div className="my-4">
            <span className="text-3xl font-extrabold text-white font-display">
              {goals.filter(g => g.status === 'completed').length}
            </span>
            <p className="text-sm font-semibold text-slate-300 mt-1">Goals Mastered</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full"
              style={{ width: `${goals.length > 0 ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{pendingGoals.length} Goals remaining</p>
        </div>

        {/* Habits Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 font-bold">Daily Habits</span>
          </div>
          <div className="my-4">
            <span className="text-3xl font-extrabold text-white font-display">
              {habitsCompletedToday.length}
            </span>
            <p className="text-sm font-semibold text-slate-300 mt-1">Habits Checked Today</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${habits.length > 0 ? (habitsCompletedToday.length / habits.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Active Tracker Habits: {habits.length}</p>
        </div>

        {/* Upcoming Deadline Counts */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-400">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-xs text-slate-500 font-bold">Events Alerts</span>
          </div>
          <div className="my-4">
            <span className="text-3xl font-extrabold text-white font-display">
              {events.filter(e => e.category === 'exam' || e.category === 'deadline').length}
            </span>
            <p className="text-sm font-semibold text-slate-300 mt-1">Critical Deadlines</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Upcoming events total: {events.length}</p>
        </div>

      </motion.div>

      {/* Main Two-Column Widgets */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Double Columns: Today's Agenda & Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Tasks Widget */}
          <div className="glass border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-violet-400" /> Today's Task Flow
              </h3>
              <button 
                onClick={() => setPage('planner')}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 group"
              >
                Go to Planner <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No tasks due today. Celebrate or add a new goal!
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 4).map(task => (
                  <div 
                    key={task._id}
                    className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-850 rounded-2xl hover:border-violet-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <span className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {task.subtasks.filter(s => s.isCompleted).length} of {task.subtasks.length} subtasks
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
                          <Clock className="h-3 w-3 text-slate-500" />
                          Today
                        </div>
                      )}
                      {task.isCompleted ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">Done</span>
                      ) : (
                        <span className="text-xs font-bold text-violet-400 bg-violet-600/10 px-2.5 py-1 rounded-md border border-violet-500/25">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming events & deadlines widget */}
          <div className="glass border border-slate-800/80 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-400" /> Deadlines & Events
              </h3>
              <button 
                onClick={() => setPage('calendar')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
              >
                View Calendar <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No upcoming events or dates. Plan ahead!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingEvents.map(event => (
                  <div 
                    key={event._id}
                    className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between"
                  >
                    <div 
                      className="absolute top-0 left-0 bottom-0 w-1" 
                      style={{ backgroundColor: event.color || '#3b82f6' }}
                    />
                    <div className="pl-2 space-y-1.5">
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-60 text-slate-400">
                        {event.category}
                      </span>
                      <h4 className="text-sm font-semibold text-white line-clamp-1">
                        {event.title}
                      </h4>
                    </div>
                    <div className="pl-2 mt-4 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Quote section & Habits tracking widget */}
        <div className="space-y-6">
          
          {/* Elegant Quote Section */}
          <div className="glass border border-slate-800/80 rounded-3xl p-6 bg-gradient-to-br from-indigo-950/20 via-violet-950/10 to-transparent relative overflow-hidden flex flex-col justify-between h-56">
            <div className="absolute top-4 right-4">
              <button 
                onClick={rotateQuote}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 mb-2">
              <BookOpen className="h-4.5 w-4.5" />
            </div>

            <div className="my-2 flex-grow overflow-y-auto">
              <p className="text-sm md:text-base font-medium text-slate-100 italic leading-relaxed">
                "{quote.text}"
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-violet-400">— {quote.author}</p>
            </div>
          </div>

          {/* Quick Habits widgets */}
          <div className="glass border border-slate-800/80 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" /> Habit Checkers
              </h3>
              <button 
                onClick={() => setPage('analytics')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
              >
                Streaks Analytics <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No habits defined. Head to Analytics & Habits to add!
              </div>
            ) : (
              <div className="space-y-3">
                {habits.slice(0, 3).map(habit => {
                  const completed = habit.completedDates && habit.completedDates.includes(todayStr);
                  return (
                    <div 
                      key={habit._id}
                      className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-850 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-200">{habit.title}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {habit.currentStreak > 0 && (
                          <div className="flex items-center gap-0.5 text-orange-400 text-xs font-bold">
                            <Flame className="h-3.5 w-3.5" />
                            <span>{habit.currentStreak}d</span>
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            const updated = await api.habits.toggle(habit._id, todayStr);
                            setHabits(habits.map(h => h._id === habit._id ? updated : h));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                            completed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {completed ? 'Checked' : 'Check Today'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}
