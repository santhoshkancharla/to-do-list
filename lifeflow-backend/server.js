require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getIsMongoConnected } = require('./db');

// Import routes
const { router: authRouter } = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const goalsRouter = require('./routes/goals');
const eventsRouter = require('./routes/events');
const notesRouter = require('./routes/notes');
const habitsRouter = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local dev/testing simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/habits', habitsRouter);

// Health check and db status info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseMode: getIsMongoConnected() ? 'MongoDB' : 'Local JSON Fallback File'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect database and start server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 LifeFlow API Server is running on port ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 DB Mode: ${getIsMongoConnected() ? 'MongoDB Cloud/Local' : 'Local JSON File Fallback'}`);
    console.log(`=========================================`);
  });
}

startServer();
