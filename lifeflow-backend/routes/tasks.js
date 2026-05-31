const express = require('express');
const { Task } = require('../models');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET all tasks for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// POST create new task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, reminderTime, categoryTags, subtasks } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const subtasksWithId = (subtasks || []).map(st => ({
      id: st.id || Math.random().toString(36).substring(2, 9),
      title: st.title,
      isCompleted: !!st.isCompleted
    }));

    const totalSubtasks = subtasksWithId.length;
    const completedSubtasks = subtasksWithId.filter(st => st.isCompleted).length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    const newTask = await Task.create({
      userId: req.user._id,
      title,
      description: description || '',
      isCompleted: totalSubtasks > 0 ? progress === 100 : false,
      priority: priority || 'medium',
      dueDate: dueDate || '',
      reminderTime: reminderTime || '',
      categoryTags: categoryTags || [],
      subtasks: subtasksWithId,
      progress
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// PUT update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, isCompleted, priority, dueDate, reminderTime, categoryTags, subtasks, progress } = req.body;

    const task = await Task.findById(req.id || req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Security check: ensure task belongs to user
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized to edit this task' });
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (description !== undefined) updatedFields.description = description;
    if (priority !== undefined) updatedFields.priority = priority;
    if (dueDate !== undefined) updatedFields.dueDate = dueDate;
    if (reminderTime !== undefined) updatedFields.reminderTime = reminderTime;
    if (categoryTags !== undefined) updatedFields.categoryTags = categoryTags;

    if (subtasks !== undefined) {
      updatedFields.subtasks = subtasks.map(st => ({
        id: st.id || Math.random().toString(36).substring(2, 9),
        title: st.title,
        isCompleted: !!st.isCompleted
      }));
      
      const total = updatedFields.subtasks.length;
      const completed = updatedFields.subtasks.filter(st => st.isCompleted).length;
      updatedFields.progress = total > 0 ? Math.round((completed / total) * 100) : (isCompleted ? 100 : 0);
      updatedFields.isCompleted = total > 0 ? updatedFields.progress === 100 : (isCompleted !== undefined ? isCompleted : task.isCompleted);
    } else {
      if (isCompleted !== undefined) {
        updatedFields.isCompleted = isCompleted;
        updatedFields.progress = isCompleted ? 100 : 0;
      }
      if (progress !== undefined) {
        updatedFields.progress = progress;
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.id || req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// DELETE task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.id || req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Security check
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.id || req.params.id);
    res.json({ message: 'Task deleted successfully', taskId: req.params.id });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

module.exports = router;
