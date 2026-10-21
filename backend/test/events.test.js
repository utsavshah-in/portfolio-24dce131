const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../server');
const Task = require('../models/Task');
const User = require('../models/User');
const cache = require('../utils/cache');
const taskEvents = require('../events/taskEvents');

let server;
let baseUrl;
let testUser;
let testToken;

function makeToken(user) {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET || 'test_jwt_secret',
    { subject: user._id.toString(), expiresIn: '1h' }
  );
}

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, headers: response.headers, data };
}

describe('Practical 10: Asynchronous Processing with Event-Driven Architecture (EventEmitter)', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    const suffix = Date.now();
    testUser = await User.create({
      name: 'Event Test User',
      email: `event_user_${suffix}@example.com`,
      passwordHash: 'dummy_hash_for_test'
    });

    testToken = makeToken(testUser);
  });

  after(async () => {
    if (testUser?._id) {
      await Task.deleteMany({ user: testUser._id });
      await User.findByIdAndDelete(testUser._id);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    cache.flushAll();
  });

  it('1. POST /tasks returns 201 Created and saves task to MongoDB', async () => {
    const payload = {
      title: 'Practical 10 Task',
      description: 'Testing EventEmitter asynchronous workflow',
      priority: 'high'
    };

    const res = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    assert.ok(res.data._id);
    assert.equal(res.data.title, 'Practical 10 Task');

    // Verify persisted in MongoDB
    const dbTask = await Task.findById(res.data._id);
    assert.ok(dbTask);
    assert.equal(dbTask.title, 'Practical 10 Task');
  });

  it('2. API response is sent immediately before the delayed notification completes', async () => {
    const payload = {
      title: 'Timing Measurement Task',
      description: 'Verify non-blocking API response delivery',
      priority: 'medium'
    };

    let notificationFinished = false;
    let completionData = null;

    const onNotificationCompleted = (data) => {
      if (data.title === payload.title) {
        notificationFinished = true;
        completionData = data;
      }
    };
    taskEvents.on('notification-completed', onNotificationCompleted);

    const apiStartTime = Date.now();
    const res = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify(payload)
    });
    const apiDuration = Date.now() - apiStartTime;

    // The API response must arrive promptly (< 1000ms), while notification takes ~2000ms
    assert.equal(res.status, 201);
    assert.ok(apiDuration < 1000, `API response took ${apiDuration}ms which is too slow`);
    assert.equal(notificationFinished, false, 'Notification must NOT finish before API response is returned');

    // Wait for the background notification to finish
    await new Promise((resolve) => {
      if (notificationFinished) return resolve();
      const check = setInterval(() => {
        if (notificationFinished) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });

    taskEvents.off('notification-completed', onNotificationCompleted);

    assert.equal(notificationFinished, true);
    assert.equal(completionData.title, payload.title);
    assert.equal(completionData.userId, testUser._id.toString());
  });

  it('3. DELETE /tasks/:id emits task-deleted only after successful deletion', async () => {
    // Create task first
    const task = await Task.create({
      title: 'Task To Delete Event',
      user: testUser._id,
      priority: 'low'
    });

    let deleteEventReceived = false;
    let deletedTaskId = null;

    const onDeleteCompleted = (data) => {
      if (data.event === 'task-deleted' && data.taskId.toString() === task._id.toString()) {
        deleteEventReceived = true;
        deletedTaskId = data.taskId.toString();
      }
    };
    taskEvents.on('notification-completed', onDeleteCompleted);

    const res = await apiRequest(`/tasks/${task._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.message, 'Task deleted successfully');

    // Verify task is deleted from MongoDB
    const inDb = await Task.findById(task._id);
    assert.equal(inDb, null);

    // Wait for notification completion
    await new Promise((resolve) => {
      if (deleteEventReceived) return resolve();
      const check = setInterval(() => {
        if (deleteEventReceived) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });

    taskEvents.off('notification-completed', onDeleteCompleted);
    assert.equal(deleteEventReceived, true);
    assert.equal(deletedTaskId, task._id.toString());
  });

  it('4. Failed DELETE (404 Not Found) does NOT emit task-deleted event', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    let deleteEventReceived = false;
    const onDelete = (task) => {
      if (task?._id?.toString() === fakeId) {
        deleteEventReceived = true;
      }
    };
    taskEvents.on('task-deleted', onDelete);

    const res = await apiRequest(`/tasks/${fakeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });

    assert.equal(res.status, 404);

    // Short wait to ensure no event was emitted
    await new Promise((r) => setTimeout(r, 200));
    taskEvents.off('task-deleted', onDelete);

    assert.equal(deleteEventReceived, false);
  });

  it('5. Invalid POST request (missing title) does NOT emit task-created event', async () => {
    let createEventReceived = false;
    const onCreate = () => { createEventReceived = true; };
    taskEvents.on('task-created', onCreate);

    const res = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ description: 'No title provided' })
    });

    assert.equal(res.status, 400);

    await new Promise((r) => setTimeout(r, 200));
    taskEvents.off('task-created', onCreate);

    assert.equal(createEventReceived, false);
  });

  it('6. Protected task routes reject missing or invalid JWTs without emitting events', async () => {
    let eventReceived = false;
    const onAnyEvent = () => { eventReceived = true; };
    taskEvents.on('task-created', onAnyEvent);

    const noTokenRes = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthorized task' })
    });
    assert.equal(noTokenRes.status, 401);

    const badTokenRes = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad.token.here' },
      body: JSON.stringify({ title: 'Bad token task' })
    });
    assert.equal(badTokenRes.status, 401);

    await new Promise((r) => setTimeout(r, 200));
    taskEvents.off('task-created', onAnyEvent);

    assert.equal(eventReceived, false);
  });

  it('7. Cache invalidation continues to work seamlessly on task creation and deletion', async () => {
    // 1. Prime cache with GET /tasks
    const get1 = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${testToken}` } });
    assert.equal(get1.status, 200);

    // 2. Second GET is a HIT
    const get2 = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${testToken}` } });
    assert.equal(get2.headers.get('x-cache'), 'HIT');

    // 3. POST /tasks invalidates cache
    const createRes = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ title: 'Cache Invalidation Verification' })
    });
    assert.equal(createRes.status, 201);

    // 4. Third GET is a MISS
    const get3 = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${testToken}` } });
    assert.equal(get3.headers.get('x-cache'), 'MISS');

    // 5. Fourth GET is a HIT
    const get4 = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${testToken}` } });
    assert.equal(get4.headers.get('x-cache'), 'HIT');

    // 6. DELETE /tasks/:id invalidates cache
    const delRes = await apiRequest(`/tasks/${createRes.data._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(delRes.status, 200);

    // 7. Fifth GET is a MISS
    const get5 = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${testToken}` } });
    assert.equal(get5.headers.get('x-cache'), 'MISS');
  });

  it('8. Safe error handling: emitting error event or faulty payload does not crash server', async () => {
    // 1. Emit an explicit error on taskEvents - should be safely caught by the error listener
    assert.doesNotThrow(() => {
      taskEvents.emit('error', new Error('Simulated EventEmitter non-fatal error'));
    });

    // 2. Emit task-created with corrupt payload - should be caught by listener try/catch
    assert.doesNotThrow(() => {
      taskEvents.emit('task-created', null);
    });

    // 3. Confirm server is still alive and responsive
    const pingRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.equal(pingRes.status, 200);
  });
});
