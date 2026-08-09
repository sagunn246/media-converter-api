/**
 * File Download & Streaming Controller
 */

const fs = require('fs');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const storageService = require('../services/storage.service');

/**
 * GET /api/download/:filename
 * Downloads or streams the converted MP3 file with HTTP Range support
 */
const downloadFile = async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      throw new ApiError(400, 'Filename parameter is required');
    }

    // Securely resolve and sanitize output path
    const filePath = storageService.getSecureOutputPath(filename);

    if (!filePath || !fs.existsSync(filePath)) {
      throw new ApiError(404, `Requested file '${filename}' was not found or has expired`);
    }

    const isDownloadParam = req.query.download === '1' || req.query.download === 'true';
    const dispositionType = isDownloadParam ? 'attachment' : 'inline';

    logger.info(`Serving file download/stream request for: ${filename} (mode: ${dispositionType})`);

    // Set header for audio streaming & attachment fallback
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(filename)}"`);


    // res.sendFile handles stream piping, HTTP Range headers (206 Partial Content), ETags & Caching natively
    return res.sendFile(filePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          next(new ApiError(500, `Failed to stream file: ${err.message}`));
        } else {
          logger.error(`Error during file stream transmission for ${filename}:`, err.message);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadFile
};
