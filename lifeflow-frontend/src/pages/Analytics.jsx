import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { 
  Flame, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calendar, 
  Hourglass, 
  Activity, 
  Sparkles,
  RefreshCw,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Analytics({ user }) {
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, tasksRes] = await Promise.all([
        api.habits.getAll(),
        api.tasks.getAll()
      ]);
      setHabits(habitsRes);
      setTasks(tasksRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    try {
      const newHabit = await api.habits.create({ title: newHabitTitle.trim(), frequency: 'daily' });
      setHabits([...habits, newHabit]);
      setNewHabitTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHabit = async (habitId, dateStr) => {
    try {
      const updated = await api.habits.toggle(habitId, dateStr);
      setHabits(habits.map(h => h._id === habitId ? updated : h));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Remove this habit?")) return;
    try {
      await api.habits.delete(habitId);
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (err) {
      console.error(err);
    }
  };

  // Generate last 7 days of tasks completion score
  const getWeeklyTaskData = () => {
    const data = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const weekdayStr = weekdays[d.getDay()];

      const dayTasks = tasks.filter(t => t.dueDate === dateStr || (t.createdAt && t.createdAt.split('T')[0] === dateStr));
      const completedCount = dayTasks.filter(t => t.isCompleted).length;
      
      data.push({
        name: weekdayStr,
        Tasks: dayTasks.length,
        Completed: completedCount,
        rate: dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0
      });
    }
    return data;
  };

  // Generate last 30 days list for GitHub-like Contribution Heatmap
  const getHeatmapDates = () => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const heatmapDates = getHeatmapDates();

  // Get completed habits count on a specific day
  const getHabitCompletionCount = (dateStr) => {
    let count = 0;
    habits.forEach(h => {
      if (h.completedDates && h.completedDates.includes(dateStr)) {
        count++;
      }
    });
    return count;
  };

  // Focus Logs Mock Calculations (Satisfying focus metrics)
  const totalFocusSessions = parseInt(localStorage.getItem('lifeflow_focus_sessions') || '12', 10);
  const totalFocusMinutes = parseInt(localStorage.getItem('lifeflow_focus_minutes') || '300', 10);
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          Productivity & Habits <Activity className="h-6 w-6 text-violet-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm">Visualize streak flame multipliers, performance charts, and weekly scores</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : (
        <>
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLUMNS: Charts & Heatmap */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Task completion weekly stats chart */}
              <div className="glass border border-slate-800 rounded-3xl p-6">
                <h3 className="font-display font-bold text-sm text-slate-350 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-violet-400" /> Weekly Task Flow Rate
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getWeeklyTaskData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#0f172a', 
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="Tasks" fill="#334155" radius={[4, 4, 0, 0]} name="Planned" />
                      <Bar dataKey="Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GitHub-like Habits Heatmap */}
              <div className="glass border border-slate-800 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-sm text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-emerald-400" /> Habits Consistency Grid
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">Last 30 Days</span>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Grid cells */}
                  <div className="grid grid-cols-10 gap-2 sm:grid-cols-15 md:grid-cols-30">
                    {heatmapDates.map(date => {
                      const count = getHabitCompletionCount(date);
                      // Determine cell shading based on completions count
                      let cellColor = 'bg-slate-900 border-slate-850';
                      let glowText = '';
                      if (count === 1) {
                        cellColor = 'bg-emerald-950/40 border-emerald-900/40';
                      } else if (count === 2) {
                        cellColor = 'bg-emerald-700/30 border-emerald-600/30 text-emerald-300';
                      } else if (count >= 3) {
                        cellColor = 'bg-emerald-500/80 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                      }
                      
                      return (
                        <div 
                          key={date}
                          className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-bold cursor-help transition-all hover:scale-115 ${cellColor}`}
                          title={`${new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${count} habits completed`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Legends */}
                  <div className="flex items-center gap-2 self-end text-[10px] text-slate-500 font-bold">
                    <span>Less</span>
                    <div className="h-3 w-3 rounded-sm bg-slate-900 border border-slate-850" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-950/40 border border-emerald-900/40" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-700/30 border border-emerald-600/30" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-500/80 border border-emerald-400" />
                    <span>More</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Habits List & Focus Timer Stats */}
            <div className="space-y-8">
              
              {/* Habits management block */}
              <div className="glass border border-slate-800 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">Daily Habit Checks</h3>
                  <p className="text-xs text-slate-450 mt-1">Form habits by performing checkboxes daily</p>
                </div>

                {/* Habit addition form */}
                <form onSubmit={handleCreateHabit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="E.g. Drink 3L Water"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </form>

                {/* Habits list */}
                {habits.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-xs italic">No habits added. Create one above!</div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {habits.map(habit => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isCompletedToday = habit.completedDates && habit.completedDates.includes(todayStr);
                        
                        return (
                          <motion.div
                            key={habit._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-850 rounded-2xl"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-200">{habit.title}</span>
                              {habit.currentStreak > 0 && (
                                <span className="text-[10px] text-orange-400 font-bold flex items-center gap-0.5">
                                  <Flame className="h-3 w-3 animate-pulse text-orange-500" />
                                  {habit.currentStreak} Day streak
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleHabit(habit._id, todayStr)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isCompletedToday
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                                }`}
                              >
                                {isCompletedToday ? 'Checked' : 'Check'}
                              </button>
                              <button
                                onClick={() => handleDeleteHabit(habit._id)}
                                className="p-1 hover:bg-rose-500/10 text-slate-550 hover:text-rose-450 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Pomodoro Focus Stats */}
              <div className="glass border border-slate-800 rounded-3xl p-6 bg-gradient-to-tr from-violet-950/20 to-transparent relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
                    <Hourglass className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <h3 className="font-display font-extrabold text-base text-white">Focus stats logs</h3>
                    <p className="text-xs text-slate-450 mt-1">Overall Pomodoro focus timer records</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-850 pt-4">
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                    <div className="text-xl font-bold text-violet-400 font-display">{focusHours}h</div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Hours</span>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                    <div className="text-xl font-bold text-violet-400 font-display">{totalFocusSessions}</div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Sessions Done</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
