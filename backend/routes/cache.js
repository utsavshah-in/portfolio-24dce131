const express = require('express');
const requireAuth = require('../middleware/auth');
const cache = require('../utils/cache');

const router = express.Router();

// Protect cache observability endpoints
router.use(requireAuth);

/**
 * GET /api/cache/stats
 * Returns current cache statistics, including hits, misses, invalidations, and TTL.
 * Sensitive data such as tokens, passwords, and connection strings are never exposed.
 */
router.get('/stats', (req, res) => {
  const stats = cache.getObservabilityStats();
  return res.status(200).json(stats);
});

/**
 * POST /api/cache/clear
 * Allows manual cache clearing for testing or debugging.
 */
router.post('/clear', (req, res) => {
  cache.flushAll();
  return res.status(200).json({ message: 'Cache flushed successfully' });
});

module.exports = router;
