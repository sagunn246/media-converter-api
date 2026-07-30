/**
 * File Deletion Controller
 */

const fs = require('fs');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/apiResponse');
const storageService = require('../services/storage.service');

/**
 * DELETE /api/file/:filename
 * Deletes converted file from storage
 */
const deleteConvertedFile = async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      throw new ApiError(400, 'Filename parameter is required');
    }

    const filePath = storageService.getSecureOutputPath(filename);

    if (!filePath || !fs.existsSync(filePath)) {
      throw new ApiError(404, `File '${filename}' not found or already deleted`);
    }

    await storageService.deleteFileAsync(filePath);
    logger.info(`Manually deleted output file: ${filename}`);

    return successResponse(res, 200, {
      message: `File '${filename}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteConvertedFile
};
