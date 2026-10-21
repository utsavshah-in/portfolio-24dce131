const NodeCache = require('node-cache');

/**
 * Shared in-memory cache instance.
 * Default TTL: 60 seconds.
 * Check period: 120 seconds (checks for and deletes expired items every 2 minutes).
 */
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false // performance optimization for in-memory reads
});

// Custom invalidation counter for observability
let invalidationCount = 0;

/**
 * Record an invalidation event
 * @param {string} reason - Action that caused invalidation ('create', 'update', 'delete', 'manual')
 * @param {string} key - Cache key invalidated
 */
cache.recordInvalidation = function (reason, key) {
  invalidationCount++;
  console.log(`[CACHE INVALIDATE] Action: ${reason} | Key: ${key} | Total invalidations: ${invalidationCount}`);
};

/**
 * Determine if caching is currently enabled via environment variable
 * Defaults to true if unset.
 */
cache.isCacheEnabled = function () {
  if (process.env.CACHE_ENABLED === undefined) return true;
  const val = String(process.env.CACHE_ENABLED).trim().toLowerCase();
  return val !== 'false' && val !== '0' && val !== 'off' && val !== 'no';
};

/**
 * Construct a user-isolated cache key
 * @param {string} userId - The MongoDB User ID
 * @returns {string} The namespaced cache key
 */
cache.getUserTasksKey = function (userId) {
  return userId ? `tasks:user:${userId}` : 'tasks:shared';
};

/**
 * Invalidate tasks cache for a user
 * @param {string} userId - The user whose cache should be invalidated
 * @param {string} reason - Cause of invalidation
 */
cache.invalidateUserTasks = function (userId, reason = 'write') {
  const key = cache.getUserTasksKey(userId);
  const existed = cache.del(key);
  cache.recordInvalidation(reason, key);
  return existed > 0;
};

/**
 * Retrieve comprehensive statistics for observability
 */
cache.getObservabilityStats = function () {
  const nodeStats = cache.getStats();
  const keys = cache.keys();
  return {
    cachingEnabled: cache.isCacheEnabled(),
    defaultTTL: 60,
    checkperiod: 120,
    stats: {
      hits: nodeStats.hits,
      misses: nodeStats.misses,
      invalidations: invalidationCount,
      keysCount: keys.length,
      ksize: nodeStats.ksize,
      vsize: nodeStats.vsize
    },
    keys
  };
};

/**
 * Reset stats (useful for automated testing)
 */
cache.resetObservabilityStats = function () {
  invalidationCount = 0;
  cache.flushStats();
  cache.flushAll();
};

module.exports = cache;
