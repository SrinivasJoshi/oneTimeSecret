const { Pool } = require('pg');
require('dotenv').config(); // Load .env variables

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Add SSL for production DBs if needed
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount }); // Optional logging
  return res;
};

// Function to initialize the database table
const initializeDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS secrets (
      reference_id VARCHAR(64) PRIMARY KEY,
      encrypted_secret TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL,
      viewed BOOLEAN DEFAULT FALSE
    );
  `;
  // Add index for faster cleanup/lookup by expiry/viewed status
  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_secrets_cleanup ON secrets (expires_at, viewed);
  `;
  try {
    await query(createTableQuery);
    await query(createIndexQuery);
    console.log('Database table "secrets" initialized successfully.');
  } catch (err) {
    console.error('Error initializing database table:', err);
    process.exit(1); // Exit if DB init fails
  }
};

// Function to cleanup expired/viewed secrets
const cleanupSecrets = async () => {
    console.log('Running secret cleanup task...');
    const deleteQuery = `
        DELETE FROM secrets
        WHERE expires_at < NOW() OR viewed = true;
    `;
    try {
        const result = await query(deleteQuery);
        if (result.rowCount > 0) {
            console.log(`Cleanup task deleted ${result.rowCount} secrets.`);
        } else {
            console.log('Cleanup task found no secrets to delete.');
        }
    } catch (err) {
        console.error('Error during secret cleanup task:', err);
    }
};

module.exports = {
  query,
  initializeDb,
  cleanupSecrets,
  pool // Export pool if needed for transactions elsewhere
};