const express = require('express');
const { Note } = require('../models');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET all notes (supports search via query parameter 'q')
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id });
    
    // Sort and filter in code to ensure it works identically for MongoDB & mock DB
    const search = req.query.q ? req.query.q.toLowerCase() : '';
    let filteredNotes = notes;
    
    if (search) {
      filteredNotes = notes.filter(n => 
        (n.title && n.title.toLowerCase().includes(search)) || 
        (n.content && n.content.toLowerCase().includes(search)) ||
        (n.category && n.category.toLowerCase().includes(search))
      );
    }

    // Sort notes: pinned first, then by updatedAt descending
    filteredNotes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    res.json(filteredNotes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ error: 'Server error fetching notes' });
  }
});

// POST create note
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, isPinned, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newNote = await Note.create({
      userId: req.user._id,
      title,
      content: content || '',
      isPinned: !!isPinned,
      category: category || 'General'
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Server error creating note' });
  }
});

// PUT update note
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, isPinned, category } = req.body;

    const note = await Note.findById(req.id || req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (content !== undefined) updatedFields.content = content;
    if (isPinned !== undefined) updatedFields.isPinned = isPinned;
    if (category !== undefined) updatedFields.category = category;

    const updatedNote = await Note.findByIdAndUpdate(
      req.id || req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    res.json(updatedNote);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Server error updating note' });
  }
});

// DELETE note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.id || req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Note.findByIdAndDelete(req.id || req.params.id);
    res.json({ message: 'Note deleted successfully', noteId: req.params.id });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

module.exports = router;
