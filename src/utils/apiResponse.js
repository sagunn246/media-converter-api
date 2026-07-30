/**
 * Standardized API Response Utilities
 */

/**
 * Format success JSON response
 * @param {import('express').Response} res 
 * @param {number} statusCode 
 * @param {object} data 
 * @param {string} [message] 
 */
const successResponse = (res, statusCode = 200, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
};

/**
 * Format error JSON response
 * @param {import('express').Response} res 
 * @param {number} statusCode 
 * @param {string} message 
 * @param {object} [details] 
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', details = null) => {
  const responsePayload = {
    success: false,
    error: message
  };

  if (details && Object.keys(details).length > 0) {
    responsePayload.details = details;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  successResponse,
  errorResponse
};
