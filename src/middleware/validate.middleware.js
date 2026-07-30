/**
 * Request Input Validation Middleware
 */

const { ALLOWED_BITRATES, DEFAULT_BITRATE } = require('../config/constants');
const ApiError = require('../utils/apiError');

/**
 * Validate conversion payload parameters (e.g. bitrate)
 */
const validateConversionInput = (req, res, next) => {
  let { bitrate } = req.body || {};

  // If no bitrate specified, set to default
  if (!bitrate) {
    req.body.bitrate = DEFAULT_BITRATE;
    return next();
  }

  // Convert to string and sanitize
  bitrate = String(bitrate).trim().replace('k', '');

  if (!ALLOWED_BITRATES.includes(bitrate)) {
    return next(
      new ApiError(
        400,
        `Invalid bitrate '${req.body.bitrate}'. Allowed bitrates are: ${ALLOWED_BITRATES.join(', ')} (e.g., 128, 192, 256, 320)`
      )
    );
  }

  req.body.bitrate = bitrate;
  next();
};

module.exports = {
  validateConversionInput
};
