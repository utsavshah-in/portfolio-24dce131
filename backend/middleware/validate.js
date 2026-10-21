function validateRegistration(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  }

  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email is required.' });
  }
  if (typeof password !== 'string' || !password.length) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
}

function validateTask(req, res, next) {
  const { title, description, completed, priority } = req.body || {};
  const errors = [];
  if (req.method === 'POST' || Object.prototype.hasOwnProperty.call(req.body || {}, 'title')) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push({ field: 'title', message: 'Title is required.' });
    } else if (title.trim().length > 160) {
      errors.push({ field: 'title', message: 'Title cannot exceed 160 characters.' });
    }
  }
  if (description !== undefined && typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be text.' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push({ field: 'completed', message: 'Completed must be true or false.' });
  }
  if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
    errors.push({ field: 'priority', message: 'Priority must be low, medium, or high.' });
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });
  next();
}

module.exports = { validateRegistration, validateLogin, validateTask };
