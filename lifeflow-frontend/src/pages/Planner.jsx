import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  Calendar, 
  AlertCircle, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Kanban,
  List,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api } from '../api';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' },
  { value: 'high', label: 'High Priority', color: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400' }
];

const CATEGORIES = ['Study', 'Work', 'Health', 'Exercise', 'Finance', 'Personal'];

const CATEGORY_COLORS = {
  Study: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400'
  },
  Work: {
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    border: 'border-sky-200 dark:border-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400'
  },
  Health: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  Exercise: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400'
  },
  Finance: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-400'
  },
  Personal: {
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    border: 'border-pink-200 dark:border-pink-500/30',
    text: 'text-pink-600 dark:text-pink-400'
  },
  default: {
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400'
  }
};

export default function Planner({ user }) {
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Task detail/modal management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [subtasksInput, setSubtasksInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  
  // UI tracking
  const [expandedTasks, setExpandedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.tasks.getAll();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(new Date().toISOString().split('T')[0]);
    setReminderTime('');
    setSelectedCategory('Personal');
    setSubtasks([]);
    setSubtasksInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setReminderTime(task.reminderTime || '');
    setSelectedCategory(task.categoryTags[0] || 'Personal');
    setSubtasks(task.subtasks || []);
    setSubtasksInput('');
    setIsModalOpen(true);
  };

  const handleAddSubtask = () => {
    if (!subtasksInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: subtasksInput.trim(),
        isCompleted: false
      }
    ]);
    setSubtasksInput('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      reminderTime,
      categoryTags: [selectedCategory],
      subtasks
    };

    try {
      if (editingTask) {
        const updated = await api.tasks.update(editingTask._id, taskData);
        setTasks(tasks.map(t => t._id === editingTask._id ? updated : t));
        if (updated.isCompleted && !editingTask.isCompleted) {
          triggerConfetti();
        }
      } else {
        const created = await api.tasks.create(taskData);
        setTasks([...tasks, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.tasks.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskCompleted = async (task) => {
    try {
      const nextCompleted = !task.isCompleted;
      const updated = await api.tasks.update(task._id, { isCompleted: nextCompleted });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));
      
      if (nextCompleted) {
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (task, subtaskId) => {
    try {
      const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
      );
      const updated = await api.tasks.update(task._id, { subtasks: updatedSubtasks });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));

      if (updated.isCompleted && !task.isCompleted) {
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b']
    });
  };

  const toggleExpandTask = (id) => {
    setExpandedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // HTML5 Drag and Drop for Kanban Board Column Transitions
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    let updatePayload = {};
    if (targetStatus === 'completed') {
      updatePayload.isCompleted = true;
      if (task.subtasks && task.subtasks.length > 0) {
        updatePayload.subtasks = task.subtasks.map(st => ({ ...st, isCompleted: true }));
      }
    } else if (targetStatus === 'todo') {
      updatePayload.isCompleted = false;
      if (task.subtasks && task.subtasks.length > 0) {
        updatePayload.subtasks = task.subtasks.map(st => ({ ...st, isCompleted: false }));
      }
    } else if (targetStatus === 'in-progress') {
      updatePayload.isCompleted = false;
      // Mark first subtask completed to make it "in-progress" if none completed
      if (task.subtasks && task.subtasks.length > 0) {
        const hasCompleted = task.subtasks.some(st => st.isCompleted);
        if (!hasCompleted) {
          const newSt = [...task.subtasks];
          newSt[0].isCompleted = true;
          updatePayload.subtasks = newSt;
        }
      }
    }

    try {
      const updated = await api.tasks.update(taskId, updatePayload);
      setTasks(tasks.map(t => t._id === taskId ? updated : t));
      if (targetStatus === 'completed' && !task.isCompleted) {
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.categoryTags.includes(filterCategory);
    return matchesSearch && matchesPriority && matchesCategory;
  });

  // Split tasks for Kanban Board Columns
  const getKanbanTasks = (status) => {
    return filteredTasks.filter(t => {
      if (status === 'completed') return t.isCompleted;
      if (status === 'in-progress') return !t.isCompleted && t.progress > 0;
      return !t.isCompleted && t.progress === 0; // todo
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Upper header action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            Flow Daily Planner <Sparkles className="h-5 w-5 text-violet-400" />
          </h2>
          <p className="text-slate-400 text-sm">Sort out your daily tasks, subtasks list, and priorities</p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-neon-violet hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter and View toolbar */}
      <div className="glass border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:shadow-neon-violet transition-all text-sm"
          />
        </div>

        {/* Priority and category selectors */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Layout switcher */}
          <div className="flex border border-slate-800 rounded-xl p-1 bg-slate-950/60 ml-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Kanban Board"
            >
              <Kanban className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main View Container */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No tasks found matching your filters. Write one up to start!
        </div>
      ) : viewMode === 'list' ? (
        
        // LIST VIEW (Collapsible & Details)
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map(task => {
              const isExpanded = !!expandedTasks[task._id];
              const priorityObj = PRIORITY_OPTIONS.find(p => p.value === task.priority);
              
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass border border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/20 transition-colors"
                >
                  {/* Task Summary Row */}
                  <div className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap bg-slate-900/10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleTaskCompleted(task)}
                        className="text-violet-400 hover:text-violet-300 transition-transform hover:scale-110 flex-shrink-0 cursor-pointer"
                      >
                        {task.isCompleted ? (
                          <CheckSquare className="h-6 w-6 text-violet-500" />
                        ) : (
                          <Square className="h-6 w-6 text-slate-600" />
                        )}
                      </button>
                      
                      <div className="min-w-0">
                        <h4 className={`text-sm font-semibold text-slate-200 truncate ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] font-semibold text-slate-500">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {task.categoryTags.map(tag => {
                            const colors = CATEGORY_COLORS[tag] || CATEGORY_COLORS.default;
                            return (
                              <span key={tag} className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${colors.bg} ${colors.border} ${colors.text}`}>
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto sm:ml-0 flex-shrink-0">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${priorityObj?.color}`}>
                        {task.priority}
                      </span>
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="text-xs font-bold text-slate-400 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-md flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-slate-500" />
                          <span>{task.progress}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 border-l border-slate-800 pl-4">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleExpandTask(task._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-850 p-5 bg-slate-950/20 space-y-4"
                      >
                        {task.description && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</span>
                            <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
                          </div>
                        )}

                        {/* Checklist Section */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtasks Checklist</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {task.subtasks.map(st => (
                                <button
                                  key={st.id}
                                  onClick={() => handleToggleSubtask(task, st.id)}
                                  className="flex items-center gap-3 p-2.5 bg-slate-900/30 border border-slate-850 rounded-xl hover:border-violet-500/20 text-left transition-all"
                                >
                                  {st.isCompleted ? (
                                    <CheckSquare className="h-4.5 w-4.5 text-violet-400 flex-shrink-0" />
                                  ) : (
                                    <Square className="h-4.5 w-4.5 text-slate-600 flex-shrink-0" />
                                  )}
                                  <span className={`text-xs font-semibold ${st.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {st.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        
        // KANBAN DRAG-AND-DROP BOARD VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Columns: Todo, In Progress, Completed */}
          {['todo', 'in-progress', 'completed'].map(col => {
            const colTasks = getKanbanTasks(col);
            const titleStr = col === 'todo' ? 'To Do' : col === 'in-progress' ? 'In Progress' : 'Completed';
            const colorGlow = col === 'todo' ? 'border-t-blue-500' : col === 'in-progress' ? 'border-t-amber-500' : 'border-t-emerald-500';
            
            return (
              <div 
                key={col}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
                className={`glass border border-slate-850 rounded-2xl p-4 bg-slate-900/10 min-h-[400px] flex flex-col border-t-2 ${colorGlow}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider">{titleStr}</h3>
                  <span className="text-[11px] font-extrabold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {colTasks.map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-violet-500/20 hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2 relative"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                          {task.title}
                        </span>
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${
                          task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                      </div>
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Subtasks</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 text-[10px] font-semibold text-slate-500">
                        <div className="flex gap-1">
                          {task.categoryTags.map(tag => {
                            const colors = CATEGORY_COLORS[tag] || CATEGORY_COLORS.default;
                            return (
                              <span key={tag} className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${colors.bg} ${colors.border} ${colors.text}`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1 hover:text-white rounded hover:bg-slate-850"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 hover:text-rose-400 rounded hover:bg-slate-850"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Task Creation/Editing Slide-in Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
                <h3 className="font-display font-bold text-lg text-white">
                  {editingTask ? 'Edit Task Settings' : 'Create New Flow Task'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="mt-4 flex flex-col flex-grow overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-grow pr-1.5 pb-4 max-h-[60vh]">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Daily Gym session"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                    <textarea
                      placeholder="Provide details about task goals..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Category Tag</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Reminder Time</label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Subtask additions inside creation modal */}
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <label className="text-xs font-bold text-slate-400 uppercase">Add Checklist Subtasks</label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add subtask title..."
                        value={subtasksInput}
                        onChange={(e) => setSubtasksInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-300 placeholder-slate-450 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="px-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {subtasks.length > 0 && (
                      <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-slate-950/20 border border-slate-850 rounded-xl">
                        {subtasks.map((st, index) => (
                          <div key={st.id || index} className="flex items-center justify-between px-3 py-1 bg-slate-900 border border-slate-800/80 rounded-lg">
                            <span className="text-xs text-slate-300">{st.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtask(st.id)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                    Save Changes
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
