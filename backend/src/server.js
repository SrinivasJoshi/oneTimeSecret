require('dotenv').config(); // Ensure env vars are loaded first
const app = require('./app');
const db = require('./services/db');

const PORT = process.env.PORT || 9000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Run cleanup every 15 minutes

// Function to start the server
async function startServer() {
  try {
    // Initialize Database (create table if not exists)
    await db.initializeDb();

    // Start periodic cleanup task
    setInterval(db.cleanupSecrets, CLEANUP_INTERVAL_MS);
    // Optional: Run cleanup once on startup
    // await db.cleanupSecrets();

    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown Handling (Optional but Recommended)
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach(signal => {
    process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        try {
            // Close database pool
            if (db.pool) {
                await db.pool.end();
                console.log('Database pool closed.');
            }
            // Perform any other cleanup
            console.log('Server shut down successfully.');
            process.exit(0);
        } catch (err) {
            console.error('Error during graceful shutdown:', err);
            process.exit(1);
        }
    });
});


startServer();