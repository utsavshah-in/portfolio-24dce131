// Reference only: merge this protection/validation pattern into your existing /tasks routes.
// Keep the Practical 5 Task model and your Practical 6 route response format.
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');

const router = express.Router();

// All task endpoints below require a valid JWT.
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    // If your Task schema has an owner field, filter by { owner: req.user.id }.
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task id.' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (error) { next(error); }
});

router.post('/', validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({
      title: req.body.title.trim(),
      description: req.body.description || '',
      completed: req.body.completed ?? false,
      priority: req.body.priority || 'medium',
    });
    res.status(201).json(task);
  } catch (error) { next(error); }
});

router.put('/:id', validateTask, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task id.' });
    const updates = {};
    for (const key of ['title', 'description', 'completed', 'priority']) {
      if (req.body[key] !== undefined) updates[key] = key === 'title' ? req.body[key].trim() : req.body[key];
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task id.' });
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.', id: task._id });
  } catch (error) { next(error); }
});

module.exports = router;
