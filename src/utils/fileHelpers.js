/**
 * File Utility Functions
 */

const fs = require('fs');
const path = require('path');
const { ALLOWED_EXTENSIONS } = require('../config/constants');

/**
 * Format bytes into human-readable string (e.g., "14.5 MB")
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format total duration in seconds to standard string (HH:MM:SS or MM:SS)
 * @param {number} seconds 
 * @returns {string}
 */
const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) {
    return '00:00';
  }

  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const paddedHrs = String(hrs).padStart(2, '0');
    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${paddedMins}:${paddedSecs}`;
};

/**
 * Sanitize filename to prevent directory traversal vulnerabilities
 * @param {string} filename 
 * @returns {string}
 */
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  // Strip out null bytes, path traversal tokens (../, ..\), and illegal filename characters
  return path.basename(filename).replace(/[\0\/\\]/g, '');
};

/**
 * Check if extension is supported
 * @param {string} filename 
 * @returns {boolean}
 */
const isAllowedExtension = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  return ALLOWED_EXTENSIONS.includes(ext);
};

/**
 * Safely delete a file if it exists
 * @param {string} filePath 
 */
const deleteFileAsync = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete file at ${filePath}:`, error.message);
  }
};

module.exports = {
  formatBytes,
  formatDuration,
  sanitizeFilename,
  isAllowedExtension,
  deleteFileAsync
};
