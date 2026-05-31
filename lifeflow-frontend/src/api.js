const API_URL = '/api';

// Token manager
let jwtToken = localStorage.getItem('lifeflow_token') || '';

export const setToken = (token) => {
  jwtToken = token;
  if (token) {
    localStorage.setItem('lifeflow_token', token);
  } else {
    localStorage.removeItem('lifeflow_token');
  }
};

export const getToken = () => jwtToken;

// Helper to make HTTP requests
async function makeRequest(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const options = { method, headers };
  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);

  // If Vite's proxy returns a Gateway Timeout/Bad Gateway (server is offline)
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new TypeError('Failed to fetch (server offline)');
  }

  let responseData = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await res.json();
    } catch (e) {
      // Empty or invalid JSON response
    }
  }

  if (!res.ok) {
    throw new Error(responseData?.error || `API Request failed with status ${res.status}`);
  }

  return responseData;
}

// Local Storage mock database fallback (for offline or local-only mode)
const getLocalData = (key, defaultVal = []) => {
  try {
    const val = localStorage.getItem(`lifeflow_local_${key}`);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  localStorage.setItem(`lifeflow_local_${key}`, JSON.stringify(val));
};

// Cloud API / Local Storage Fallback implementation
export const api = {
  // Authentication
  auth: {
    register: async (username, email, password) => {
      try {
        const res = await makeRequest('/auth/register', 'POST', { username, email, password });
        setToken(res.token);
        localStorage.setItem('lifeflow_user', JSON.stringify(res.user));
        return res;
      } catch (err) {
        // Fallback for demo without backend
        if (err.message.includes('Failed to fetch')) {
          const user = { id: 'local-user', username, email, streak: 1, maxStreak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
          setToken('local-mock-token');
          localStorage.setItem('lifeflow_user', JSON.stringify(user));
          return { token: 'local-mock-token', user };
        }
        throw err;
      }
    },
    login: async (email, password) => {
      try {
        const res = await makeRequest('/auth/login', 'POST', { email, password });
        setToken(res.token);
        localStorage.setItem('lifeflow_user', JSON.stringify(res.user));
        return res;
      } catch (err) {
        if (err.message.includes('Failed to fetch')) {
          // Check local fallback
          const localUser = JSON.parse(localStorage.getItem('lifeflow_user') || 'null');
          if (localUser && localUser.email === email) {
            setToken('local-mock-token');
            // Update streak
            const today = new Date().toISOString().split('T')[0];
            localUser.streak = (localUser.streak || 0) + 1;
            localUser.lastActiveDate = today;
            localStorage.setItem('lifeflow_user', JSON.stringify(localUser));
            return { token: 'local-mock-token', user: localUser };
          }
          throw new Error('Local user not found or password mismatch. Connect to server or register.');
        }
        throw err;
      }
    },
    googleLogin: async (email, username, googleId) => {
      try {
        const res = await makeRequest('/auth/google', 'POST', { email, username, googleId });
        setToken(res.token);
        localStorage.setItem('lifeflow_user', JSON.stringify(res.user));
        return res;
      } catch (err) {
        if (err.message.includes('Failed to fetch')) {
          const user = { id: 'local-user-google', username: username || email.split('@')[0], email, streak: 1, maxStreak: 1, lastActiveDate: new Date().toISOString().split('T')[0] };
          setToken('local-mock-token');
          localStorage.setItem('lifeflow_user', JSON.stringify(user));
          return { token: 'local-mock-token', user };
        }
        throw err;
      }
    },
    me: async () => {
      try {
        if (!jwtToken) return null;
        if (jwtToken === 'local-mock-token') {
          return JSON.parse(localStorage.getItem('lifeflow_user') || 'null');
        }
        const user = await makeRequest('/auth/me', 'GET');
        localStorage.setItem('lifeflow_user', JSON.stringify(user));
        return user;
      } catch (err) {
        return JSON.parse(localStorage.getItem('lifeflow_user') || 'null');
      }
    },
    logout: () => {
      setToken('');
      localStorage.removeItem('lifeflow_user');
    }
  },

  // Daily Tasks
  tasks: {
    getAll: async () => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const tasks = await makeRequest('/tasks', 'GET');
        setLocalData('tasks', tasks);
        return tasks;
      } catch (err) {
        return getLocalData('tasks');
      }
    },
    create: async (taskData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const task = await makeRequest('/tasks', 'POST', taskData);
        const local = getLocalData('tasks');
        setLocalData('tasks', [...local, task]);
        return task;
      } catch (err) {
        const local = getLocalData('tasks');
        const subtasks = (taskData.subtasks || []).map(st => ({
          id: Math.random().toString(36).substring(2, 9),
          title: st.title,
          isCompleted: false
        }));
        const total = subtasks.length;
        const progress = total > 0 ? 0 : 0;
        
        const newTask = {
          _id: Math.random().toString(36).substring(2, 9),
          userId: 'local',
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate || '',
          reminderTime: taskData.reminderTime || '',
          categoryTags: taskData.categoryTags || [],
          subtasks,
          progress,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocalData('tasks', [...local, newTask]);
        return newTask;
      }
    },
    update: async (id, taskData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const task = await makeRequest(`/tasks/${id}`, 'PUT', taskData);
        const local = getLocalData('tasks');
        setLocalData('tasks', local.map(t => t._id === id ? task : t));
        return task;
      } catch (err) {
        const local = getLocalData('tasks');
        const task = local.find(t => t._id === id);
        if (!task) throw new Error('Task not found');
        
        const updated = { ...task, ...taskData, updatedAt: new Date().toISOString() };
        if (taskData.subtasks !== undefined) {
          const total = updated.subtasks.length;
          const completed = updated.subtasks.filter(st => st.isCompleted).length;
          updated.progress = total > 0 ? Math.round((completed / total) * 100) : (updated.isCompleted ? 100 : 0);
          updated.isCompleted = total > 0 ? updated.progress === 100 : updated.isCompleted;
        } else if (taskData.isCompleted !== undefined) {
          updated.progress = taskData.isCompleted ? 100 : 0;
        }
        
        setLocalData('tasks', local.map(t => t._id === id ? updated : t));
        return updated;
      }
    },
    delete: async (id) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        await makeRequest(`/tasks/${id}`, 'DELETE');
      } catch (err) {
        // Continue locally
      }
      const local = getLocalData('tasks');
      setLocalData('tasks', local.filter(t => t._id !== id));
      return { taskId: id };
    }
  },

  // Goal Tracking
  goals: {
    getAll: async () => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const goals = await makeRequest('/goals', 'GET');
        setLocalData('goals', goals);
        return goals;
      } catch (err) {
        return getLocalData('goals');
      }
    },
    create: async (goalData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const goal = await makeRequest('/goals', 'POST', goalData);
        const local = getLocalData('goals');
        setLocalData('goals', [...local, goal]);
        return goal;
      } catch (err) {
        const local = getLocalData('goals');
        const subgoals = (goalData.subgoals || []).map(sg => ({
          title: sg.title,
          isCompleted: false
        }));
        const total = subgoals.length;
        
        const newGoal = {
          _id: Math.random().toString(36).substring(2, 9),
          userId: 'local',
          title: goalData.title,
          targetDate: goalData.targetDate || '',
          notes: goalData.notes || '',
          subgoals,
          progress: 0,
          status: 'not-started',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocalData('goals', [...local, newGoal]);
        return newGoal;
      }
    },
    update: async (id, goalData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const goal = await makeRequest(`/goals/${id}`, 'PUT', goalData);
        const local = getLocalData('goals');
        setLocalData('goals', local.map(g => g._id === id ? goal : g));
        return goal;
      } catch (err) {
        const local = getLocalData('goals');
        const goal = local.find(g => g._id === id);
        if (!goal) throw new Error('Goal not found');
        
        const updated = { ...goal, ...goalData, updatedAt: new Date().toISOString() };
        if (goalData.subgoals !== undefined) {
          const total = updated.subgoals.length;
          const completed = updated.subgoals.filter(sg => sg.isCompleted).length;
          updated.progress = total > 0 ? Math.round((completed / total) * 100) : (updated.status === 'completed' ? 100 : 0);
          updated.status = updated.progress === 100 ? 'completed' : (updated.progress > 0 ? 'in-progress' : updated.status);
        }
        
        setLocalData('goals', local.map(g => g._id === id ? updated : g));
        return updated;
      }
    },
    delete: async (id) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        await makeRequest(`/goals/${id}`, 'DELETE');
      } catch (err) {
        // Continue locally
      }
      const local = getLocalData('goals');
      setLocalData('goals', local.filter(g => g._id !== id));
      return { goalId: id };
    }
  },

  // Notes
  notes: {
    getAll: async (searchQuery = '') => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const notes = await makeRequest(`/notes?q=${encodeURIComponent(searchQuery)}`, 'GET');
        setLocalData('notes', notes);
        return notes;
      } catch (err) {
        const local = getLocalData('notes');
        const search = searchQuery.toLowerCase();
        let filtered = local;
        if (search) {
          filtered = local.filter(n => 
            (n.title && n.title.toLowerCase().includes(search)) || 
            (n.content && n.content.toLowerCase().includes(search)) ||
            (n.category && n.category.toLowerCase().includes(search))
          );
        }
        filtered.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        return filtered;
      }
    },
    create: async (noteData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const note = await makeRequest('/notes', 'POST', noteData);
        const local = getLocalData('notes');
        setLocalData('notes', [...local, note]);
        return note;
      } catch (err) {
        const local = getLocalData('notes');
        const newNote = {
          _id: Math.random().toString(36).substring(2, 9),
          userId: 'local',
          title: noteData.title,
          content: noteData.content || '',
          isPinned: !!noteData.isPinned,
          category: noteData.category || 'General',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocalData('notes', [...local, newNote]);
        return newNote;
      }
    },
    update: async (id, noteData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const note = await makeRequest(`/notes/${id}`, 'PUT', noteData);
        const local = getLocalData('notes');
        setLocalData('notes', local.map(n => n._id === id ? note : n));
        return note;
      } catch (err) {
        const local = getLocalData('notes');
        const note = local.find(n => n._id === id);
        if (!note) throw new Error('Note not found');
        
        const updated = { ...note, ...noteData, updatedAt: new Date().toISOString() };
        setLocalData('notes', local.map(n => n._id === id ? updated : n));
        return updated;
      }
    },
    delete: async (id) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        await makeRequest(`/notes/${id}`, 'DELETE');
      } catch (err) {
        // Continue locally
      }
      const local = getLocalData('notes');
      setLocalData('notes', local.filter(n => n._id !== id));
      return { noteId: id };
    }
  },

  // Calendar events
  events: {
    getAll: async () => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const events = await makeRequest('/events', 'GET');
        setLocalData('events', events);
        return events;
      } catch (err) {
        return getLocalData('events');
      }
    },
    create: async (eventData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const event = await makeRequest('/events', 'POST', eventData);
        const local = getLocalData('events');
        setLocalData('events', [...local, event]);
        return event;
      } catch (err) {
        const local = getLocalData('events');
        const newEvent = {
          _id: Math.random().toString(36).substring(2, 9),
          userId: 'local',
          title: eventData.title,
          date: eventData.date,
          category: eventData.category || 'other',
          isRecurring: eventData.isRecurring || 'none',
          color: eventData.color || '#3b82f6',
          reminder: !!eventData.reminder,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocalData('events', [...local, newEvent]);
        return newEvent;
      }
    },
    update: async (id, eventData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const event = await makeRequest(`/events/${id}`, 'PUT', eventData);
        const local = getLocalData('events');
        setLocalData('events', local.map(e => e._id === id ? event : e));
        return event;
      } catch (err) {
        const local = getLocalData('events');
        const event = local.find(e => e._id === id);
        if (!event) throw new Error('Event not found');
        
        const updated = { ...event, ...eventData, updatedAt: new Date().toISOString() };
        setLocalData('events', local.map(e => e._id === id ? updated : e));
        return updated;
      }
    },
    delete: async (id) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        await makeRequest(`/events/${id}`, 'DELETE');
      } catch (err) {
        // Continue locally
      }
      const local = getLocalData('events');
      setLocalData('events', local.filter(e => e._id !== id));
      return { eventId: id };
    }
  },

  // Habits tracker
  habits: {
    getAll: async () => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const habits = await makeRequest('/habits', 'GET');
        setLocalData('habits', habits);
        return habits;
      } catch (err) {
        return getLocalData('habits');
      }
    },
    create: async (habitData) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const habit = await makeRequest('/habits', 'POST', habitData);
        const local = getLocalData('habits');
        setLocalData('habits', [...local, habit]);
        return habit;
      } catch (err) {
        const local = getLocalData('habits');
        const newHabit = {
          _id: Math.random().toString(36).substring(2, 9),
          userId: 'local',
          title: habitData.title,
          frequency: habitData.frequency || 'daily',
          completedDates: [],
          currentStreak: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocalData('habits', [...local, newHabit]);
        return newHabit;
      }
    },
    toggle: async (id, date) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        const habit = await makeRequest(`/habits/${id}/toggle`, 'POST', { date });
        const local = getLocalData('habits');
        setLocalData('habits', local.map(h => h._id === id ? habit : h));
        return habit;
      } catch (err) {
        const local = getLocalData('habits');
        const habit = local.find(h => h._id === id);
        if (!habit) throw new Error('Habit not found');
        
        let completed = [...(habit.completedDates || [])];
        const idx = completed.indexOf(date);
        if (idx > -1) {
          completed.splice(idx, 1);
        } else {
          completed.push(date);
        }
        
        // Inline streak calculation for local offline
        completed.sort((a,b) => new Date(b) - new Date(a));
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        let streak = 0;
        if (completed[0] === today || completed[0] === yesterday) {
          let check = new Date(completed[0]);
          for (let d of completed) {
            if (d === check.toISOString().split('T')[0]) {
              streak++;
              check.setDate(check.getDate() - 1);
            } else {
              break;
            }
          }
        }
        
        const updated = { ...habit, completedDates: completed, currentStreak: streak, updatedAt: new Date().toISOString() };
        setLocalData('habits', local.map(h => h._id === id ? updated : h));
        return updated;
      }
    },
    delete: async (id) => {
      try {
        if (jwtToken === 'local-mock-token') throw new Error('Offline mode');
        await makeRequest(`/habits/${id}`, 'DELETE');
      } catch (err) {
        // Continue locally
      }
      const local = getLocalData('habits');
      setLocalData('habits', local.filter(h => h._id !== id));
      return { habitId: id };
    }
  },

  // Backup & Restore
  backup: {
    exportData: () => {
      const data = {
        tasks: getLocalData('tasks'),
        goals: getLocalData('goals'),
        notes: getLocalData('notes'),
        events: getLocalData('events'),
        habits: getLocalData('habits'),
        user: JSON.parse(localStorage.getItem('lifeflow_user') || 'null'),
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importData: (jsonData) => {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.tasks) setLocalData('tasks', parsed.tasks);
        if (parsed.goals) setLocalData('goals', parsed.goals);
        if (parsed.notes) setLocalData('notes', parsed.notes);
        if (parsed.events) setLocalData('events', parsed.events);
        if (parsed.habits) setLocalData('habits', parsed.habits);
        if (parsed.user) localStorage.setItem('lifeflow_user', JSON.stringify(parsed.user));
        return true;
      } catch (err) {
        console.error('Import failed:', err);
        return false;
      }
    },
    syncCloud: async () => {
      if (!jwtToken || jwtToken === 'local-mock-token') {
        throw new Error('Please login to a live cloud account to synchronize.');
      }
      
      try {
        // Sync pulls and pushes (simple reconciliation: upload all local items missing on server)
        const localTasks = getLocalData('tasks');
        const localNotes = getLocalData('notes');
        const localGoals = getLocalData('goals');
        const localEvents = getLocalData('events');
        const localHabits = getLocalData('habits');

        // Fetch cloud state
        const serverTasks = await makeRequest('/tasks', 'GET');
        const serverNotes = await makeRequest('/notes', 'GET');
        const serverGoals = await makeRequest('/goals', 'GET');
        const serverEvents = await makeRequest('/events', 'GET');
        const serverHabits = await makeRequest('/habits', 'GET');

        // Merge rules (server wins for duplicates, offline created items get sent to cloud)
        // Task synchronization
        for (let t of localTasks) {
          if (t._id.startsWith('local') || !serverTasks.some(st => st._id === t._id)) {
            await makeRequest('/tasks', 'POST', t);
          }
        }
        // Note synchronization
        for (let n of localNotes) {
          if (n._id.startsWith('local') || !serverNotes.some(sn => sn._id === n._id)) {
            await makeRequest('/notes', 'POST', n);
          }
        }
        // Goal synchronization
        for (let g of localGoals) {
          if (g._id.startsWith('local') || !serverGoals.some(sg => sg._id === g._id)) {
            await makeRequest('/goals', 'POST', g);
          }
        }
        // Event synchronization
        for (let e of localEvents) {
          if (e._id.startsWith('local') || !serverEvents.some(se => se._id === e._id)) {
            await makeRequest('/events', 'POST', e);
          }
        }
        // Habits synchronization
        for (let h of localHabits) {
          if (h._id.startsWith('local') || !serverHabits.some(sh => sh._id === h._id)) {
            await makeRequest('/habits', 'POST', h);
          }
        }

        // Pull fresh synced list
        const syncedTasks = await makeRequest('/tasks', 'GET');
        const syncedNotes = await makeRequest('/notes', 'GET');
        const syncedGoals = await makeRequest('/goals', 'GET');
        const syncedEvents = await makeRequest('/events', 'GET');
        const syncedHabits = await makeRequest('/habits', 'GET');

        setLocalData('tasks', syncedTasks);
        setLocalData('notes', syncedNotes);
        setLocalData('goals', syncedGoals);
        setLocalData('events', syncedEvents);
        setLocalData('habits', syncedHabits);

        return { success: true };
      } catch (err) {
        console.error('Sync failed:', err);
        throw err;
      }
    }
  }
};
