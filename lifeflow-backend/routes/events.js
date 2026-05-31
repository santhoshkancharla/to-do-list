const express = require('express');
const { Event } = require('../models');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user._id });
    res.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// POST create event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, date, category, isRecurring, color, reminder } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const newEvent = await Event.create({
      userId: req.user._id,
      title,
      date, // YYYY-MM-DD
      category: category || 'other',
      isRecurring: isRecurring || 'none',
      color: color || '#3b82f6',
      reminder: !!reminder
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error creating event' });
  }
});

// PUT update event
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, date, category, isRecurring, color, reminder } = req.body;

    const event = await Event.findById(req.id || req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (date !== undefined) updatedFields.date = date;
    if (category !== undefined) updatedFields.category = category;
    if (isRecurring !== undefined) updatedFields.isRecurring = isRecurring;
    if (color !== undefined) updatedFields.color = color;
    if (reminder !== undefined) updatedFields.reminder = reminder;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.id || req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Server error updating event' });
  }
});

// DELETE event
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.id || req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.id || req.params.id);
    res.json({ message: 'Event deleted successfully', eventId: req.params.id });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

module.exports = router;
