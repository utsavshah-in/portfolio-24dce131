require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const cacheRoutes = require('./routes/cache');
const { registerTaskListeners } = require('./events/taskListeners');

// Register EventEmitter listeners exactly once during server startup (Practical 10)
registerTaskListeners();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/api/cache', cacheRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message || err);
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    const details = err.name === 'ValidationError'
      ? Object.values(err.errors).map((item) => item.message)
      : [err.message];
    return res.status(400).json({ error: 'Validation failed', details });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }

  return res.status(500).json({ error: 'Something went wrong' });
});

let server;

async function start() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI. Create a .env file using .env.example.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    server = app.listen(PORT, () => {
      console.log(`Task API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

function handleShutdown(signal) {
  console.log(`[Process] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Process] HTTP server closed.');
      try {
        await mongoose.disconnect();
        console.log('[Process] MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('[Process] Error closing MongoDB connection:', err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (require.main === module) {
  start();
}

module.exports = app;
