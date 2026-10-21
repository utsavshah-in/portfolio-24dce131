const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../../utils/cache');

describe('Unit Test: In-Memory Cache Utilities (utils/cache.js)', () => {
  beforeEach(() => {
    cache.flushAll();
    cache.flushStats();
  });

  it('generates a user-isolated cache key format tasks:user:<id>', () => {
    const key = cache.getUserTasksKey('user_abc_123');
    assert.equal(key, 'tasks:user:user_abc_123');
  });

  it('falls back to tasks:shared when no user ID is provided', () => {
    const key = cache.getUserTasksKey(null);
    assert.equal(key, 'tasks:shared');
  });

  it('correctly stores and retrieves data in memory', () => {
    const sampleTasks = [{ _id: '1', title: 'Unit test task' }];
    cache.set('test:key', sampleTasks);

    const retrieved = cache.get('test:key');
    assert.deepEqual(retrieved, sampleTasks);
  });

  it('reports undefined on a cache miss', () => {
    const missing = cache.get('nonexistent:key');
    assert.equal(missing, undefined);
  });

  it('invalidates user cache key and increments invalidation counter', () => {
    const userId = 'user_target_999';
    const key = cache.getUserTasksKey(userId);

    // Populate cache
    cache.set(key, [{ title: 'Before invalidation' }]);
    assert.ok(cache.get(key));

    const initialStats = cache.getObservabilityStats();

    // Trigger invalidation
    cache.invalidateUserTasks(userId, 'create');

    // Assert key was purged
    assert.equal(cache.get(key), undefined);

    // Assert invalidation counter incremented
    const updatedStats = cache.getObservabilityStats();
    assert.equal(updatedStats.stats.invalidations, initialStats.stats.invalidations + 1);
  });
});
