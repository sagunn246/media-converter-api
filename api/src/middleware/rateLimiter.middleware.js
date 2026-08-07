/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const env = require('../config/env.config');

/**
 * Standard rate limiter for general API endpoints
 */
const generalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxGeneral,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

/**
 * Strict rate limiter for CPU-intensive file conversion operations
 */
const convertLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxConvert,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Conversion rate limit exceeded. Please wait before submitting more conversion tasks.'
  }
});

module.exports = {
  generalLimiter,
  convertLimiter
};
