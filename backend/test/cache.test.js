const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../server');
const Task = require('../models/Task');
const User = require('../models/User');
const cache = require('../utils/cache');

let server;
let baseUrl;
let userA;
let userB;
let tokenA;
let tokenB;

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

describe('Practical 8: Server-Side Caching with node-cache', () => {
  before(async () => {
    // Ensure MongoDB connection is open
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Start server on an ephemeral port (port 0)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Create isolated test users for testing
    const suffix = Date.now();
    userA = await User.create({
      name: 'Test User A',
      email: `test_user_a_${suffix}@example.com`,
      passwordHash: 'dummy_hash_for_test'
    });
    userB = await User.create({
      name: 'Test User B',
      email: `test_user_b_${suffix}@example.com`,
      passwordHash: 'dummy_hash_for_test'
    });

    tokenA = makeToken(userA);
    tokenB = makeToken(userB);
  });

  after(async () => {
    // Clean up created test users and their tasks
    if (userA?._id) {
      await Task.deleteMany({ user: userA._id });
      await User.findByIdAndDelete(userA._id);
    }
    if (userB?._id) {
      await Task.deleteMany({ user: userB._id });
      await User.findByIdAndDelete(userB._id);
    }

    cache.resetObservabilityStats();

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  beforeEach(() => {
    // Clear in-memory cache and stats before each test
    cache.flushAll();
    cache.flushStats();
    process.env.CACHE_ENABLED = 'true';
  });

  it('1. First GET /tasks request is a cache miss', async () => {
    const res = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-cache'), 'MISS');
    assert.ok(Array.isArray(res.data));
  });

  it('2. A repeated GET /tasks request is a cache hit', async () => {
    // First request - MISS
    const firstRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(firstRes.status, 200);
    assert.equal(firstRes.headers.get('x-cache'), 'MISS');

    // Repeated request - HIT
    const secondRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(secondRes.status, 200);
    assert.equal(secondRes.headers.get('x-cache'), 'HIT');
  });

  it('3. The cached response matches the database response', async () => {
    // Create a task for User A directly in DB
    const createdTask = await Task.create({
      title: 'Database Task Matching Test',
      user: userA._id
    });

    // Request 1: DB query (cache MISS)
    const missRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(missRes.status, 200);
    assert.equal(missRes.headers.get('x-cache'), 'MISS');

    // Request 2: Served from cache (cache HIT)
    const hitRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(hitRes.status, 200);
    assert.equal(hitRes.headers.get('x-cache'), 'HIT');

    // Data must match identically
    assert.deepEqual(hitRes.data, missRes.data);
    assert.ok(hitRes.data.some((t) => t._id === createdTask._id.toString()));

    await Task.findByIdAndDelete(createdTask._id);
  });

  it('4. Creating a task invalidates the cached list', async () => {
    // Prime the cache with a GET
    await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    const primedRes = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal(primedRes.headers.get('x-cache'), 'HIT');

    // Create a new task (POST)
    const postRes = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Task invalidation on create' })
    });
    assert.equal(postRes.status, 201);

    // Next GET must be a MISS because cache was invalidated
    const nextGetRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(nextGetRes.status, 200);
    assert.equal(nextGetRes.headers.get('x-cache'), 'MISS');
    assert.ok(nextGetRes.data.some((t) => t.title === 'Task invalidation on create'));

    // Clean up created task
    if (postRes.data?._id) {
      await Task.findByIdAndDelete(postRes.data._id);
    }
  });

  it('5. Updating a task invalidates the cached list', async () => {
    // Create task
    const task = await Task.create({ title: 'Task to update', user: userA._id });

    // Prime the cache
    await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    const primedRes = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal(primedRes.headers.get('x-cache'), 'HIT');

    // Update the task (PUT)
    const putRes = await apiRequest(`/tasks/${task._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Task updated title', completed: true })
    });
    assert.equal(putRes.status, 200);
    assert.equal(putRes.data.title, 'Task updated title');

    // Next GET must be a MISS
    const nextGetRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(nextGetRes.status, 200);
    assert.equal(nextGetRes.headers.get('x-cache'), 'MISS');

    await Task.findByIdAndDelete(task._id);
  });

  it('6. Deleting a task invalidates the cached list', async () => {
    // Create task
    const task = await Task.create({ title: 'Task to delete', user: userA._id });

    // Prime the cache
    await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    const primedRes = await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal(primedRes.headers.get('x-cache'), 'HIT');

    // Delete the task (DELETE)
    const delRes = await apiRequest(`/tasks/${task._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(delRes.status, 200);

    // Next GET must be a MISS
    const nextGetRes = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(nextGetRes.status, 200);
    assert.equal(nextGetRes.headers.get('x-cache'), 'MISS');
  });

  it("7. Requests by different authenticated users cannot receive each other's cached data", async () => {
    // Create a task exclusively for User A
    const taskA = await Task.create({ title: "User A's Secret Task", user: userA._id });
    // Create a task exclusively for User B
    const taskB = await Task.create({ title: "User B's Task", user: userB._id });

    // User A requests tasks (primes User A's cache)
    const resA = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resA.status, 200);
    assert.equal(resA.headers.get('x-cache'), 'MISS');
    assert.ok(resA.data.some((t) => t.title === "User A's Secret Task"));
    assert.ok(!resA.data.some((t) => t.title === "User B's Task"));

    // User B requests tasks: must be a MISS for User B and must NOT return User A's task
    const resB = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resB.status, 200);
    assert.equal(resB.headers.get('x-cache'), 'MISS');
    assert.ok(resB.data.some((t) => t.title === "User B's Task"));
    assert.ok(!resB.data.some((t) => t.title === "User A's Secret Task"));

    // User A requests again: must be HIT with User A's data
    const resAHit = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resAHit.headers.get('x-cache'), 'HIT');
    assert.ok(resAHit.data.some((t) => t.title === "User A's Secret Task"));

    // User B requests again: must be HIT with User B's data
    const resBHit = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(resBHit.headers.get('x-cache'), 'HIT');
    assert.ok(resBHit.data.some((t) => t.title === "User B's Task"));

    await Task.findByIdAndDelete(taskA._id);
    await Task.findByIdAndDelete(taskB._id);
  });

  it('8. Invalid or missing JWT tokens are still rejected by protected routes', async () => {
    // Missing Authorization header
    const missingRes = await apiRequest('/tasks');
    assert.equal(missingRes.status, 401);

    // Invalid Authorization header format
    const malformedRes = await apiRequest('/tasks', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' }
    });
    assert.equal(malformedRes.status, 401);

    // Invalid JWT signature
    const invalidTokenRes = await apiRequest('/tasks', {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' }
    });
    assert.equal(invalidTokenRes.status, 401);
  });

  it('9. MongoDB or request errors are handled correctly', async () => {
    // Invalid ObjectId format in GET /tasks/:id
    const badIdRes = await apiRequest('/tasks/invalid-object-id', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(badIdRes.status, 400);
    assert.ok(badIdRes.data.error.includes('Invalid task ID'));

    // Validation failure in POST /tasks (empty title)
    const invalidPostRes = await apiRequest('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: '' })
    });
    assert.equal(invalidPostRes.status, 400);
  });

  it('10. Disabling caching bypasses the cache and still returns valid task data', async () => {
    // Disable caching via environment variable
    process.env.CACHE_ENABLED = 'false';

    // First request with caching disabled
    const res1 = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('x-cache'), 'BYPASS');
    assert.ok(Array.isArray(res1.data));

    // Second request with caching disabled: still BYPASS (not HIT)
    const res2 = await apiRequest('/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('x-cache'), 'BYPASS');
    assert.deepEqual(res2.data, res1.data);
  });

  it('Observability: GET /api/cache/stats returns safe metrics', async () => {
    // Prime a cache hit
    await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });
    await apiRequest('/tasks', { headers: { Authorization: `Bearer ${tokenA}` } });

    const statsRes = await apiRequest('/api/cache/stats', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(statsRes.status, 200);
    assert.equal(typeof statsRes.data.stats.hits, 'number');
    assert.equal(typeof statsRes.data.stats.misses, 'number');
    assert.equal(typeof statsRes.data.defaultTTL, 'number');
    assert.ok(statsRes.data.defaultTTL === 60);

    // Verify secrets are not leaked
    const jsonStr = JSON.stringify(statsRes.data);
    assert.ok(!jsonStr.includes('password'));
    assert.ok(!jsonStr.includes(process.env.JWT_SECRET || 'test_jwt_secret'));
    assert.ok(!jsonStr.includes('mongodb'));
  });
});
