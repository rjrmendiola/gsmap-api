const rateLimit = require('express-rate-limit');

const weatherLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 requests per IP per minute — tune as needed
  message: { error: 'Too many requests, please try later.' }
});

module.exports = { weatherLimiter };
