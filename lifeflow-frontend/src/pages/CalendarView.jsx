import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Trash2, 
  Edit3,
  Bell, 
  Sparkles,
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

const CATEGORIES = [
  { value: 'birthday', label: 'Birthday', color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { value: 'exam', label: 'Exam Date', color: '#8b5cf6', bg: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
  { value: 'interview', label: 'Interview Reminder', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { value: 'deadline', label: 'Deadline Alert', color: '#f43f5e', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  { value: 'other', label: 'Other Event', color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400' }
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarView({ user }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [agendaView, setAgendaView] = useState('selected'); // 'selected' or 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Event modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('other');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [isRecurring, setIsRecurring] = useState('none');
  const [reminder, setReminder] = useState(false);

  const handleNavigateToEventDate = (dateStr) => {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return;
    setCurrentDate(target);
    setSelectedDate(target);
    setAgendaView('selected');
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.events.getAll();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    // Sync creation form date
    setEventDate(clickedDate.toISOString().split('T')[0]);
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setEventDate(selectedDate.toISOString().split('T')[0]);
    setCategory('other');
    setSelectedColor('#3b82f6');
    setIsRecurring('none');
    setReminder(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setEventDate(event.date);
    setCategory(event.category || 'other');
    setSelectedColor(event.color || '#3b82f6');
    setIsRecurring(event.isRecurring || 'none');
    setReminder(!!event.reminder);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    // Pick matching color if category changes
    const matchedCategory = CATEGORIES.find(c => c.value === category);
    const eventColor = matchedCategory ? matchedCategory.color : selectedColor;

    const eventData = {
      title: title.trim(),
      date: eventDate,
      category,
      isRecurring,
      color: eventColor,
      reminder
    };

    try {
      if (editingEvent) {
        const updated = await api.events.update(editingEvent._id, eventData);
        setEvents(events.map(e => e._id === editingEvent._id ? updated : e));
      } else {
        const newEvent = await api.events.create(eventData);
        setEvents([...events, newEvent]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this calendar event?")) return;
    try {
      await api.events.delete(id);
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Monthly Calendar Calculations
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  
  // Previous month padding days
  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const daysInPrevMonth = getDaysInMonth(prevMonthDate);
  const prevDaysToRender = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDaysToRender.push(daysInPrevMonth - i);
  }

  // Current month days
  const currentDaysToRender = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);

  // Next month padding days (grid is 42 cells total for clean 6-row layout)
  const remainingCells = 42 - (prevDaysToRender.length + currentDaysToRender.length);
  const nextDaysToRender = Array.from({ length: remainingCells }, (_, idx) => idx + 1);

  // Format calendar day key YYYY-MM-DD
  const formatDayKey = (day, offset = 0) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, day);
    return checkDate.toISOString().split('T')[0];
  };

  // Get events on a specific day
  const getDayEvents = (dayKey) => {
    return events.filter(e => {
      // Basic date match
      if (e.date === dayKey) return true;
      
      // Handle recurring logic
      if (e.isRecurring === 'none') return false;
      
      const eventDateObj = new Date(e.date);
      const cellDateObj = new Date(dayKey);
      
      // Cannot recur before it starts
      if (cellDateObj < eventDateObj) return false;
      
      if (e.isRecurring === 'daily') {
        return true;
      }
      if (e.isRecurring === 'weekly') {
        return eventDateObj.getDay() === cellDateObj.getDay();
      }
      if (e.isRecurring === 'monthly') {
        return eventDateObj.getDate() === cellDateObj.getDate();
      }
      return false;
    });
  };

  // Agenda events for currently selected date
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const agendaEvents = getDayEvents(selectedDateKey);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            LifeFlow Calendar <Calendar className="h-6 w-6 text-violet-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm">Organize schedules, recurring alarms, exam prep milestones, and deadlines</p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-neon-violet hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT & CENTER: Calendar Month Grid View */}
        <div className="lg:col-span-2 glass border border-slate-800 rounded-3xl p-6 space-y-4">
          
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-100">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <div className="flex items-center gap-2 border border-slate-850 p-1 rounded-xl bg-slate-950/60">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Monthly grid */}
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <RefreshCw className="h-7 w-7 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                {WEEKDAYS.map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                
                {/* Previous month filler days */}
                {prevDaysToRender.map((day, idx) => {
                  const dayKey = formatDayKey(day, -1);
                  const dayEvents = getDayEvents(dayKey);
                  return (
                    <div 
                      key={`prev-${idx}`}
                      className="p-2 border border-slate-900/40 bg-slate-950/10 text-slate-650 min-h-[76px] rounded-xl flex flex-col justify-between opacity-30 select-none text-xs"
                    >
                      <span>{day}</span>
                      <div className="flex gap-1 flex-wrap overflow-hidden h-4">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e._id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Current month days */}
                {currentDaysToRender.map(day => {
                  const dayKey = formatDayKey(day, 0);
                  const dayEvents = getDayEvents(dayKey);
                  const isSelected = selectedDateKey === dayKey;
                  const isToday = new Date().toISOString().split('T')[0] === dayKey;
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`p-2 border text-left min-h-[82px] rounded-xl flex flex-col justify-between transition-all text-xs cursor-pointer ${
                        isSelected 
                          ? 'border-violet-600 bg-violet-600/10 text-violet-400 shadow-neon-violet' 
                          : isToday
                          ? 'border-slate-800 bg-slate-900 text-white font-bold'
                          : 'border-slate-850 hover:border-slate-700 bg-slate-900/30 text-slate-300'
                      }`}
                    >
                      <span className={`${isToday && !isSelected ? 'text-violet-400' : ''}`}>{day}</span>
                      
                      {/* Color Dots for day's events */}
                      <div className="flex gap-1 flex-wrap max-h-[16px] overflow-hidden mt-1.5">
                        {dayEvents.slice(0, 4).map(e => (
                          <div 
                            key={e._id} 
                            className="h-1.5 w-1.5 rounded-full" 
                            style={{ backgroundColor: e.color || '#3b82f6' }} 
                            title={e.title}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-[9px] font-extrabold text-slate-500 leading-none">+{dayEvents.length - 4}</span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Next month filler days */}
                {nextDaysToRender.map((day, idx) => {
                  const dayKey = formatDayKey(day, 1);
                  const dayEvents = getDayEvents(dayKey);
                  return (
                    <div 
                      key={`next-${idx}`}
                      className="p-2 border border-slate-900/40 bg-slate-950/10 text-slate-650 min-h-[76px] rounded-xl flex flex-col justify-between opacity-30 select-none text-xs"
                    >
                      <span>{day}</span>
                      <div className="flex gap-1 flex-wrap overflow-hidden h-4">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e._id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                        ))}
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Active Agenda List Details */}
        <div className="glass border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col h-full max-h-[600px]">
          <div className="border-b border-slate-800/80 pb-4 flex-shrink-0">
            <h3 className="font-display font-extrabold text-white text-base">
              Agenda summary
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border border-slate-850 p-1 rounded-xl bg-slate-950/60 flex-shrink-0">
            <button
              onClick={() => setAgendaView('selected')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                agendaView === 'selected' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Selected Day
            </button>
            <button
              onClick={() => setAgendaView('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                agendaView === 'all' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              All Events ({events.length})
            </button>
          </div>

          {agendaView === 'all' && (
            <input
              type="text"
              placeholder="Search all events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-xs flex-shrink-0"
            />
          )}

          <div className="flex-grow overflow-y-auto pr-1 space-y-3">
            {agendaView === 'selected' ? (
              agendaEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm italic">
                  No calendar entries scheduled for this date.
                </div>
              ) : (
                agendaEvents.map(event => {
                  const categoryObj = CATEGORIES.find(c => c.value === event.category);
                  return (
                    <div 
                      key={event._id}
                      className="p-3.5 bg-slate-900/40 border border-slate-855 rounded-2xl relative overflow-hidden flex items-start justify-between"
                    >
                      <div 
                        className="absolute top-0 left-0 bottom-0 w-1" 
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      
                      <div className="pl-2.5 space-y-1.5">
                        <h4 className="text-xs font-semibold text-slate-200">{event.title}</h4>
                        <div className="flex gap-1.5 flex-wrap">
                          {categoryObj && (
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${categoryObj.bg}`}>
                              {categoryObj.label}
                            </span>
                          )}
                          {event.isRecurring !== 'none' && (
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-slate-750 bg-slate-800 text-slate-400">
                              Recur: {event.isRecurring}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleOpenEditModal(event)}
                          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Remove Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              (() => {
                const filteredAll = events
                  .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => new Date(a.date) - new Date(b.date));

                if (filteredAll.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-500 text-sm italic">
                      No matching events found.
                    </div>
                  );
                }

                return filteredAll.map(event => {
                  const categoryObj = CATEGORIES.find(c => c.value === event.category);
                  const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div 
                      key={event._id}
                      className="p-3.5 bg-slate-900/40 border border-slate-850 hover:border-slate-700/50 rounded-2xl relative overflow-hidden flex items-start justify-between cursor-pointer transition-all hover:bg-slate-900/60"
                      onClick={() => handleNavigateToEventDate(event.date)}
                    >
                      <div 
                        className="absolute top-0 left-0 bottom-0 w-1" 
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      
                      <div className="pl-2.5 space-y-1.5 flex-1 min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{event.title}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-violet-400">{formattedDate}</span>
                          {categoryObj && (
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${categoryObj.bg}`}>
                              {categoryObj.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(event)}
                          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Remove Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

      </div>

      {/* Calendar event creation modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
                <h3 className="font-display font-bold text-lg text-white">
                  {editingEvent ? 'Edit Calendar Event' : 'Add Calendar Event'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="mt-4 flex flex-col flex-grow overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-grow pr-1.5 pb-4 max-h-[60vh]">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Biology midterm exam"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-350 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Category Tag</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Recurrence</label>
                      <select
                        value={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4.5 w-4.5 text-violet-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">Alert Notifications</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Alert reminders prior to event schedule</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reminder}
                      onChange={(e) => setReminder(e.target.checked)}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-850 rounded"
                    />
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white shadow-neon-violet hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    {editingEvent ? 'Save Changes' : 'Save Event'}
                  </button>
                </div>

              </form>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
