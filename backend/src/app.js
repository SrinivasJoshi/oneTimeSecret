const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const setupSecurityHeaders = require('./middleware/securityHeaders');
const secretRoutes = require('./routes/secretRoutes');

dotenv.config(); // Load environment variables

const app = express();

// --- Middleware ---

// Enable CORS - Adjust origins as needed for production
app.use(cors({ origin: '*' })); // Be more specific in production!

// Security Headers (Helmet)
app.use(setupSecurityHeaders());

// Body Parsing
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.get('/health', (req, res) => res.status(200).send('OK')); // Health check endpoint
app.use('/api/secrets', secretRoutes); // Mount secret routes

// --- Error Handling ---

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack || err); // Log the error stack
  // Avoid sending stack trace to client in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({ message });
});

module.exports = app;