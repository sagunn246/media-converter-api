/**
 * Custom Operational Error Class for HTTP API Errors
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP Status Code
   * @param {string} message - Error description
   * @param {boolean} isOperational - Indicates whether the error is trusted operational error
   * @param {string} stack - Error stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
