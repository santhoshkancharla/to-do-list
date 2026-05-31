const express = require('express');
const { Goal } = require('../models');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET all goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    res.json(goals);
  } catch (error) {
    console.error('Fetch goals error:', error);
    res.status(500).json({ error: 'Server error fetching goals' });
  }
});

// POST create goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, targetDate, notes, subgoals } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const subgoalsList = (subgoals || []).map(sg => ({
      title: sg.title,
      isCompleted: !!sg.isCompleted
    }));

    const total = subgoalsList.length;
    const completed = subgoalsList.filter(sg => sg.isCompleted).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let status = 'not-started';
    if (progress === 100) {
      status = 'completed';
    } else if (progress > 0 || notes || targetDate) {
      status = 'in-progress';
    }

    const newGoal = await Goal.create({
      userId: req.user._id,
      title,
      targetDate: targetDate || '',
      progress,
      notes: notes || '',
      status,
      subgoals: subgoalsList
    });

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Server error creating goal' });
  }
});

// PUT update goal
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, targetDate, notes, status, subgoals, progress } = req.body;

    const goal = await Goal.findById(req.id || req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (targetDate !== undefined) updatedFields.targetDate = targetDate;
    if (notes !== undefined) updatedFields.notes = notes;

    if (subgoals !== undefined) {
      updatedFields.subgoals = subgoals.map(sg => ({
        title: sg.title,
        isCompleted: !!sg.isCompleted
      }));
      
      const total = updatedFields.subgoals.length;
      const completed = updatedFields.subgoals.filter(sg => sg.isCompleted).length;
      updatedFields.progress = total > 0 ? Math.round((completed / total) * 100) : (status === 'completed' ? 100 : 0);
      
      if (updatedFields.progress === 100) {
        updatedFields.status = 'completed';
      } else if (updatedFields.progress > 0) {
        updatedFields.status = 'in-progress';
      } else {
        updatedFields.status = status || goal.status;
      }
    } else {
      if (status !== undefined) updatedFields.status = status;
      if (progress !== undefined) updatedFields.progress = progress;
    }

    const updatedGoal = await Goal.findByIdAndUpdate(
      req.id || req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error updating goal' });
  }
});

// DELETE goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findById(req.id || req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Goal.findByIdAndDelete(req.id || req.params.id);
    res.json({ message: 'Goal deleted successfully', goalId: req.params.id });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Server error deleting goal' });
  }
});

module.exports = router;
