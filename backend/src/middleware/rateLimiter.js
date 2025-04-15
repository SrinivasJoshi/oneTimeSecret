const rateLimit = require('express-rate-limit');
require('dotenv').config();

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // Default 15 mins
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // Default 100 requests

const apiLimiter = rateLimit({
  windowMs: windowMs,
  max: maxRequests,
  message: 'Too many requests from this IP, please try again after a while.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    // Consider using req.ip which respects 'trust proxy' settings if applicable
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  },
   handler: (req, res, next, options) => {
       console.warn(`Rate limit exceeded for IP: ${req.ip || req.socket.remoteAddress}`);
       res.status(options.statusCode).send(options.message);
   }
});

module.exports = apiLimiter;