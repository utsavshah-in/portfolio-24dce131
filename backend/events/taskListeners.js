const taskEvents = require('./taskEvents');

// Configurable notification delay (default: 2000ms as required for Practical 10 demonstration)
const NOTIFICATION_DELAY_MS = process.env.NOTIFICATION_DELAY_MS !== undefined
  ? Number(process.env.NOTIFICATION_DELAY_MS)
  : 2000;

let isRegistered = false;

/**
 * Register all domain event listeners for task notifications.
 * Safe against double-registration.
 */
function registerTaskListeners() {
  if (isRegistered) return;

  // Safe error listener: prevents unhandled EventEmitter errors from crashing Node.js
  taskEvents.on('error', (err) => {
    console.error(`[Event Error] Safe error handler caught: ${err.message || err}`);
  });

  // Listener for 'task-created' event (Practical 10 primary requirement)
  taskEvents.on('task-created', async (task) => {
    const startTime = new Date().toISOString();
    console.log(`[Notification] Handler started at: ${startTime}`);

    try {
      if (!task || !task.title) {
        throw new Error('Missing task payload in task-created event');
      }

      // Non-blocking asynchronous delay (~2 seconds)
      if (NOTIFICATION_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, NOTIFICATION_DELAY_MS));
      }

      const finishTime = new Date().toISOString();
      const userId = task.user ? (task.user._id || task.user).toString() : 'unassigned';
      console.log(`[Notification] Task "${task.title}" created for user ${userId} at: ${finishTime}`);

      // Emit completion notification for automated test verification and observability
      taskEvents.emit('notification-completed', {
        event: 'task-created',
        taskId: task._id,
        title: task.title,
        userId,
        startTime,
        finishTime
      });
    } catch (error) {
      console.error(`[Notification Error] Failed processing task-created notification: ${error.message}`);
    }
  });

  // Listener for 'task-deleted' event (Practical 10 supplementary requirement 5)
  taskEvents.on('task-deleted', async (task) => {
    const startTime = new Date().toISOString();
    console.log(`[Notification] Deletion handler started at: ${startTime}`);

    try {
      if (!task || !task.title) {
        throw new Error('Missing task payload in task-deleted event');
      }

      // Non-blocking asynchronous delay
      const deleteDelay = Math.min(NOTIFICATION_DELAY_MS, 1000);
      if (deleteDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, deleteDelay));
      }

      const finishTime = new Date().toISOString();
      const userId = task.user ? (task.user._id || task.user).toString() : 'unassigned';
      console.log(`[Notification] Task "${task.title}" (ID: ${task._id}) deleted for user ${userId} at: ${finishTime}`);

      taskEvents.emit('notification-completed', {
        event: 'task-deleted',
        taskId: task._id,
        title: task.title,
        userId,
        startTime,
        finishTime
      });
    } catch (error) {
      console.error(`[Notification Error] Failed processing task-deleted notification: ${error.message}`);
    }
  });

  isRegistered = true;
  console.log('[Events] Task event listeners registered successfully');
}

module.exports = {
  registerTaskListeners,
  NOTIFICATION_DELAY_MS
};
