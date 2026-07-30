/**
 * Environment Variables Configuration & Validation
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10),
  uploadDir: process.env.UPLOAD_DIR 
    ? path.resolve(process.env.UPLOAD_DIR) 
    : path.join(__dirname, '../../uploads'),
  outputDir: process.env.OUTPUT_DIR 
    ? path.resolve(process.env.OUTPUT_DIR) 
    : path.join(__dirname, '../../output'),

  fileRetentionHours: parseInt(process.env.FILE_RETENTION_HOURS || '24', 10),
  cleanupCronSchedule: process.env.CLEANUP_CRON_SCHEDULE || '0 * * * *', // Every hour by default

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  rateLimitMaxGeneral: parseInt(process.env.RATE_LIMIT_MAX_GENERAL || '100', 10),
  rateLimitMaxConvert: parseInt(process.env.RATE_LIMIT_MAX_CONVERT || '10', 10)
};

module.exports = env;
