/**
 * Centralized Operational Error Handler Middleware
 */

const multer = require('multer');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');
const { deleteFileAsync } = require('../utils/fileHelpers');
const env = require('../config/env.config');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found`));
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Clean up any uploaded temporary file if error occurs after file received by multer
  if (req.file && req.file.path) {
    logger.info(`Cleaning up temporary upload file after request error: ${req.file.path}`);
    await deleteFileAsync(req.file.path);
  }

  // Handle Multer-specific error codes
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `Uploaded file exceeds maximum allowed size of ${env.maxFileSizeMB} MB`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected field name '${err.field}'. Expected form-data field name: 'file'`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Log error stack in non-production environments or if 500
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${err.stack || err}`);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${message}`);
  }

  const details = env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : null;

  return errorResponse(res, statusCode, message, details);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
