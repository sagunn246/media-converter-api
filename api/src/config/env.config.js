/**
 * Environment Variables Configuration & Validation
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const parseEnvInt = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const port = parseEnvInt(process.env.PORT, 3000);

const env = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  
  maxFileSizeMB: parseEnvInt(process.env.MAX_FILE_SIZE_MB, 500),
  uploadDir: process.env.UPLOAD_DIR 
    ? path.resolve(process.env.UPLOAD_DIR) 
    : path.join(__dirname, '../../uploads'),
  outputDir: process.env.OUTPUT_DIR 
    ? path.resolve(process.env.OUTPUT_DIR) 
    : path.join(__dirname, '../../output'),

  fileRetentionHours: parseEnvInt(process.env.FILE_RETENTION_HOURS, 24),
  cleanupCronSchedule: process.env.CLEANUP_CRON_SCHEDULE || '0 * * * *', // Every hour by default

  rateLimitWindowMs: parseEnvInt(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 mins
  rateLimitMaxGeneral: parseEnvInt(process.env.RATE_LIMIT_MAX_GENERAL, 100),
  rateLimitMaxConvert: parseEnvInt(process.env.RATE_LIMIT_MAX_CONVERT, 10)
};

module.exports = env;
