import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  FileText,
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Goals({ user }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('not-started');
  
  const [subgoalsInput, setSubgoalsInput] = useState('');
  const [subgoals, setSubgoals] = useState([]);
  
  const [expandedGoals, setExpandedGoals] = useState({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await api.goals.getAll();
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetDate('');
    setNotes('');
    setStatus('not-started');
    setSubgoals([]);
    setSubgoalsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetDate(goal.targetDate || '');
    setNotes(goal.notes || '');
    setStatus(goal.status);
    setSubgoals(goal.subgoals || []);
    setSubgoalsInput('');
    setIsModalOpen(true);
  };

  const handleAddSubgoal = () => {
    if (!subgoalsInput.trim()) return;
    setSubgoals([
      ...subgoals,
      {
        title: subgoalsInput.trim(),
        isCompleted: false
      }
    ]);
    setSubgoalsInput('');
  };

  const handleRemoveSubgoal = (index) => {
    setSubgoals(subgoals.filter((_, idx) => idx !== index));
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const goalData = {
      title: title.trim(),
      targetDate,
      notes: notes.trim(),
      status,
      subgoals
    };

    try {
      if (editingGoal) {
        const updated = await api.goals.update(editingGoal._id, goalData);
        setGoals(goals.map(g => g._id === editingGoal._id ? updated : g));
      } else {
        const created = await api.goals.create(goalData);
        setGoals([...goals, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal and all its milestones?")) return;
    try {
      await api.goals.delete(id);
      setGoals(goals.filter(g => g._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubgoal = async (goal, subgoalIndex) => {
    try {
      const updatedSubgoals = goal.subgoals.map((sg, idx) => 
        idx === subgoalIndex ? { ...sg, isCompleted: !sg.isCompleted } : sg
      );
      
      const updated = await api.goals.update(goal._id, { subgoals: updatedSubgoals });
      setGoals(goals.map(g => g._id === goal._id ? updated : g));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpandGoal = (id) => {
    setExpandedGoals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            Goals & Milestones <Target className="h-6 w-6 text-violet-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-sm">Design, track and execute your long-term & short-term objectives</p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-neon-violet hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{goals.length}</div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Target Objectives</p>
          </div>
        </div>

        <div className="glass border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {goals.filter(g => g.status === 'in-progress').length}
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Active Goals In-Progress</p>
          </div>
        </div>

        <div className="glass border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {goals.filter(g => g.status === 'completed').length}
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Completed & Mastered Goals</p>
          </div>
        </div>
      </div>

      {/* Goals grid list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="glass border border-slate-800 rounded-3xl p-16 text-center text-slate-500 text-sm">
          No goals initialized yet. Hit "New Goal" to map out your long-term success path.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {goals.map(goal => {
              const isExpanded = !!expandedGoals[goal._id];
              const progressVal = goal.progress || 0;
              
              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="glass border border-slate-800 hover:border-violet-500/20 rounded-2xl p-5 flex flex-col justify-between transition-all space-y-4"
                >
                  {/* Goal Card Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-slate-200">
                          {goal.title}
                        </h3>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          goal.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : goal.status === 'in-progress'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {goal.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      {goal.targetDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Progress Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Completion Score</span>
                      <span>{progressVal}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>

                  {/* Expand Subgoals action bar */}
                  <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      {(goal.subgoals || []).length} Milestones Tracked
                    </span>
                    <button
                      onClick={() => toggleExpandGoal(goal._id)}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Hide Milestones <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Show Milestones <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>

                  {/* Milestones Checklist Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3 pt-2"
                      >
                        {goal.notes && (
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                            <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <p>{goal.notes}</p>
                          </div>
                        )}
                        
                        {(goal.subgoals || []).length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">No specific sub-milestones set for this goal.</p>
                        ) : (
                          <div className="space-y-2">
                            {goal.subgoals.map((sg, index) => (
                              <button
                                key={index}
                                onClick={() => handleToggleSubgoal(goal, index)}
                                className="w-full flex items-center gap-3 p-2.5 bg-slate-950/30 hover:bg-slate-900 border border-slate-900 rounded-xl hover:border-violet-500/20 text-left transition-all"
                              >
                                {sg.isCompleted ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-violet-400 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5 text-slate-700 flex-shrink-0" />
                                )}
                                <span className={`text-xs font-semibold ${sg.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                  {sg.title}
                                </span>
                              </button>
                            ))}
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
      )}

      {/* Goal creation modal */}
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
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
                <h3 className="font-display font-bold text-lg text-white">
                  {editingGoal ? 'Edit Goal Objectives' : 'Initialize Objective Goal'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="mt-4 flex flex-col flex-grow overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-grow pr-1.5 pb-4 max-h-[60vh]">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Goal Title</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Build 3 MERN Stack Apps"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-violet-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Target Finish Date</label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Current Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Notes & Strategies</label>
                    <textarea
                      placeholder="Describe milestones, tactics, or course studies..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm resize-none"
                    />
                  </div>

                  {/* Subgoals tree additions */}
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <label className="text-xs font-bold text-slate-400 uppercase">Add Milestones / Sub-goals</label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add milestone name..."
                        value={subgoalsInput}
                        onChange={(e) => setSubgoalsInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubgoal(); } }}
                        className="flex-1 px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-350 placeholder-slate-600 focus:outline-none focus:border-violet-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubgoal}
                        className="px-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {subgoals.length > 0 && (
                      <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-slate-950/20 border border-slate-850 rounded-xl">
                        {subgoals.map((sg, index) => (
                          <div key={index} className="flex items-center justify-between px-3 py-1 bg-slate-900 border border-slate-800/80 rounded-lg">
                            <span className="text-xs text-slate-300">{sg.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubgoal(index)}
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
                    Save Goal
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
