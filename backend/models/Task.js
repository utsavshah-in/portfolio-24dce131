const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  }
});

// Explicit pre-save hook to demonstrate automatic title trimming.
taskSchema.pre('save', function (next) {
  if (typeof this.title === 'string') this.title = this.title.trim();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
