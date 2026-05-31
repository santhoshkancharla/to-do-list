const express = require('express');
const { Habit } = require('../models');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Helper to calculate daily streak from completedDates array
function calculateDailyStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;
  
  // Normalize and sort dates in descending order (newest first)
  const uniqueDates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // If the newest date is neither today nor yesterday, streak is broken
  const newestDate = uniqueDates[0];
  if (newestDate !== today && newestDate !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = new Date(newestDate);
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const current = uniqueDates[i];
    const expected = checkDate.toISOString().split('T')[0];
    
    if (current === expected) {
      streak++;
      // Set checkDate to the day before
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Gap found, streak ends
    }
  }
  
  return streak;
}

// GET all habits
router.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    // Recalculate streaks before sending to ensure accuracy
    for (let habit of habits) {
      const calculated = calculateDailyStreak(habit.completedDates);
      if (habit.currentStreak !== calculated) {
        habit.currentStreak = calculated;
        await habit.save();
      }
    }
    res.json(habits);
  } catch (error) {
    console.error('Fetch habits error:', error);
    res.status(500).json({ error: 'Server error fetching habits' });
  }
});

// POST create habit
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, frequency } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newHabit = await Habit.create({
      userId: req.user._id,
      title,
      frequency: frequency || 'daily',
      completedDates: [],
      currentStreak: 0
    });

    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Server error creating habit' });
  }
});

// POST toggle habit completion date
router.post('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD format
    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    const habit = await Habit.findById(req.id || req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    let dates = [...(habit.completedDates || [])];
    const index = dates.indexOf(date);

    if (index > -1) {
      // Date exists, remove it (toggle off)
      dates.splice(index, 1);
    } else {
      // Date doesn't exist, add it (toggle on)
      dates.push(date);
    }

    const currentStreak = calculateDailyStreak(dates);

    const updatedHabit = await Habit.findByIdAndUpdate(
      req.id || req.params.id,
      { 
        $set: { 
          completedDates: dates,
          currentStreak: currentStreak
        } 
      },
      { new: true }
    );

    res.json(updatedHabit);
  } catch (error) {
    console.error('Toggle habit error:', error);
    res.status(500).json({ error: 'Server error toggling habit' });
  }
});

// DELETE habit
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findById(req.id || req.params.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Habit.findByIdAndDelete(req.id || req.params.id);
    res.json({ message: 'Habit deleted successfully', habitId: req.params.id });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Server error deleting habit' });
  }
});

module.exports = router;
