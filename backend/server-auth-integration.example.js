// Integration snippet — merge into your existing backend/server.js.
// Keep your current MongoDB connection and cors() setup.
// Make sure express.json() is registered before these routes.
const authRoutes = require('./routes/auth');
const protectedTaskRoutes = require('./routes/tasks-protected-example');

app.use('/api/auth', authRoutes);
app.use('/tasks', protectedTaskRoutes);

// IMPORTANT: remove/disable any previous app.use('/tasks', ...) registration,
// or duplicate route handlers may run. Place your 404 and error middleware AFTER routes.
