const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lifeflow_secret_key';

// Helper to safely calculate and update user active streak
const updateUserStreak = async (user) => {
  const today = new Date().toISOString().split('T')[0];
  let updatedStreak = user.streak || 0;
  let updatedMaxStreak = user.maxStreak || 0;

  if (user.lastActiveDate) {
    if (user.lastActiveDate === today) {
      // Already active today, nothing to do
      return user;
    }

    const lastActive = new Date(user.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate - lastActive);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Active yesterday, increment streak
      updatedStreak += 1;
    } else if (diffDays > 1) {
      // Broke streak, reset to 1
      updatedStreak = 1;
    }
  } else {
    // First time activity
    updatedStreak = 1;
  }

  user.streak = updatedStreak;
  user.maxStreak = Math.max(updatedMaxStreak, updatedStreak);
  user.lastActiveDate = today;
  await user.save();
  return user;
};

// JWT authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Dynamic Streak Update on Activity
    try {
      await updateUserStreak(user);
    } catch (streakErr) {
      console.error('Failed to update streak in authMiddleware:', streakErr.message);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Route: Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      streak: 1,
      maxStreak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0]
    });

    // Create Token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        streak: newUser.streak,
        maxStreak: newUser.maxStreak,
        lastActiveDate: newUser.lastActiveDate,
        profilePic: newUser.profilePic
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Route: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update streak logic
    await updateUserStreak(user);

    // Create Token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        streak: user.streak,
        maxStreak: user.maxStreak,
        lastActiveDate: user.lastActiveDate,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Route: Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    streak: req.user.streak,
    maxStreak: req.user.maxStreak,
    lastActiveDate: req.user.lastActiveDate,
    profilePic: req.user.profilePic
  });
});

// Mock/Fake Google Login
router.post('/google', async (req, res) => {
  try {
    const { email, username, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google login requires email' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists
      // Fake password since they log in via Google
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(googleId || 'google_fallback_password', salt);
      user = await User.create({
        username: username || email.split('@')[0],
        email,
        password: hashedPassword,
        streak: 1,
        maxStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0]
      });
    }

    // Update streak logic
    await updateUserStreak(user);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        streak: user.streak,
        maxStreak: user.maxStreak,
        lastActiveDate: user.lastActiveDate,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google login server error' });
  }
});

module.exports = {
  router,
  authMiddleware
};
