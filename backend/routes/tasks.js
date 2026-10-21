const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');
const cache = require('../utils/cache');
const taskEvents = require('../events/taskEvents');

const router = express.Router();

// All task routes require a valid JWT token
router.use(requireAuth);

/**
 * GET /tasks
 * Retrieves all tasks belonging to the authenticated user.
 * Supports in-memory caching via node-cache when CACHE_ENABLED is not false.
 */
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = cache.getUserTasksKey(req.user.id);
    const cachingEnabled = cache.isCacheEnabled();

    if (cachingEnabled) {
      const cachedTasks = cache.get(cacheKey);
      if (cachedTasks !== undefined) {
        console.log(`[CACHE HIT] Key: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedTasks);
      }
      console.log(`[CACHE MISS] Key: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');
    } else {
      console.log(`[CACHE BYPASS] CACHE_ENABLED is false; fetching directly from database`);
      res.setHeader('X-Cache', 'BYPASS');
    }

    // Query MongoDB for tasks belonging to the current user
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Store in cache only if caching is enabled
    if (cachingEnabled) {
      cache.set(cacheKey, tasks);
    }

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tasks/:id
 * Retrieve a specific task by ID if owned by the authenticated user.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Ensure the task belongs to the authenticated user
    if (task.user && task.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /tasks
 * Creates a new task and invalidates the user's task cache.
 * Emits 'task-created' event asynchronously after response is sent (Practical 10).
 */
router.post('/', validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({
      title: req.body.title.trim(),
      description: req.body.description || '',
      completed: req.body.completed ?? false,
      priority: req.body.priority || 'medium',
      user: req.user.id
    });

    const savedAt = new Date().toISOString();
    console.log(`[API] Task saved at: ${savedAt}`);

    // Invalidate user's cached task list after successful database write
    cache.invalidateUserTasks(req.user.id, 'create');

    // Send HTTP response promptly before background event processing
    res.status(201).json(task);
    const sentAt = new Date().toISOString();
    console.log(`[API] Response sent at: ${sentAt}`);

    // Emit event asynchronously on next event-loop tick (Practical 10)
    setImmediate(() => {
      taskEvents.emit('task-created', task);
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /tasks/:id
 * Updates an existing task and invalidates the user's task cache.
 */
router.put('/:id', validateTask, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const existing = await Task.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existing.user && existing.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this task' });
    }

    const updates = {};
    for (const key of ['title', 'description', 'completed', 'priority']) {
      if (req.body[key] !== undefined) {
        updates[key] = key === 'title' ? req.body[key].trim() : req.body[key];
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // Invalidate user's cached task list after successful database write
    cache.invalidateUserTasks(req.user.id, 'update');

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /tasks/:id
 * Deletes a task and invalidates the user's task cache.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const existing = await Task.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existing.user && existing.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this task' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    // Invalidate user's cached task list after successful database write
    cache.invalidateUserTasks(req.user.id, 'delete');

    res.status(200).json({ message: 'Task deleted successfully', task });
    const deleteSentAt = new Date().toISOString();
    console.log(`[API] Delete response sent at: ${deleteSentAt}`);

    // Emit task-deleted event only after successful deletion (Practical 10)
    setImmediate(() => {
      taskEvents.emit('task-deleted', task);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
