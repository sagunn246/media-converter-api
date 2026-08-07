/**
 * Storage Service & Automated File Cleanup Management
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const env = require('../config/env.config');
const logger = require('../utils/logger');
const { deleteFileAsync, sanitizeFilename } = require('../utils/fileHelpers');

/**
 * Ensure required directory structure exists
 */
const initializeStorageDirectories = () => {
  const dirs = [env.uploadDir, env.outputDir];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

/**
 * Delete output files older than retention limit (default 24 hours)
 */
const cleanupOldOutputFiles = async () => {
  try {
    logger.info('Running scheduled output file cleanup task...');
    if (!fs.existsSync(env.outputDir)) return;

    const files = await fs.promises.readdir(env.outputDir);
    const now = Date.now();
    const retentionMs = env.fileRetentionHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(env.outputDir, file);
      try {
        const stats = await fs.promises.stat(filePath);
        const fileAgeMs = now - stats.mtimeMs;

        if (fileAgeMs > retentionMs) {
          await fs.promises.unlink(filePath);
          deletedCount++;
          logger.info(`Cleaned up expired file (${env.fileRetentionHours}h+ old): ${file}`);
        }
      } catch (err) {
        logger.error(`Error processing file ${file} during cleanup:`, err.message);
      }
    }

    logger.info(`Cleanup task finished. Removed ${deletedCount} expired file(s).`);
  } catch (error) {
    logger.error('Error during scheduled file cleanup:', error.message);
  }
};

/**
 * Clean up leftover temporary files in uploads directory
 */
const cleanupStaleUploadFiles = async () => {
  try {
    if (!fs.existsSync(env.uploadDir)) return;
    const files = await fs.promises.readdir(env.uploadDir);
    for (const file of files) {
      const filePath = path.join(env.uploadDir, file);
      await deleteFileAsync(filePath);
    }
    logger.info('Cleaned up stale upload files on startup');
  } catch (error) {
    logger.error('Error cleaning up stale uploads:', error.message);
  }
};

/**
 * Start recurring cron job for automated file retention cleanup
 */
const initScheduledCleanup = () => {
  logger.info(`Initializing file cleanup cron schedule: "${env.cleanupCronSchedule}" (Retention: ${env.fileRetentionHours}h)`);
  cron.schedule(env.cleanupCronSchedule, () => {
    cleanupOldOutputFiles();
  });
};

/**
 * Resolve path to output file securely
 * @param {string} filename 
 * @returns {string|null} Absolute file path or null if invalid/outside output directory
 */
const getSecureOutputPath = (filename) => {
  const safeFilename = sanitizeFilename(filename);
  if (!safeFilename) return null;

  const targetDir = path.resolve(env.outputDir);
  const resolvedPath = path.resolve(targetDir, safeFilename);

  // Guard against path traversal outside of outputDir
  const relative = path.relative(targetDir, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return resolvedPath;
};

module.exports = {
  initializeStorageDirectories,
  cleanupOldOutputFiles,
  cleanupStaleUploadFiles,
  initScheduledCleanup,
  getSecureOutputPath,
  deleteFileAsync
};
