const express = require('express');
const secretController = require('../controllers/secretController');
const apiLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting to secret creation and consumption
router.post('/', apiLimiter, secretController.createSecret);
router.post('/:id/consume', apiLimiter, secretController.consumeSecret);

module.exports = router;