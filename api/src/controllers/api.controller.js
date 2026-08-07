/**
 * General API & Health Controllers
 */

const { successResponse } = require('../utils/apiResponse');

/**
 * GET /
 * API Root Information Status Endpoint
 */
const getApiStatus = (req, res) => {
  return successResponse(res, 200, {
    message: 'Media Converter REST API is operational',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      convert: 'POST /api/convert (multipart/form-data with "file" and optional "bitrate")',
      download: 'GET /api/download/:filename',
      delete: 'DELETE /api/file/:filename'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * GET /health
 * Health Check Monitoring Endpoint
 */
const getHealthCheck = (req, res) => {
  return successResponse(res, 200, {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getApiStatus,
  getHealthCheck
};
