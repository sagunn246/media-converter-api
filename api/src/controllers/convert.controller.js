/**
 * Media Conversion Controller
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env.config');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const ffmpegService = require('../services/ffmpeg.service');
const { deleteFileAsync } = require('../utils/fileHelpers');
const FileMetadata = require('../models/fileMetadata.model');
const { saveHistoryItem } = require('./history.controller');

/**
 * POST /api/convert
 * Accepts multipart file upload, converts to MP3, returns download link & metadata
 */
const convertFile = async (req, res, next) => {
  let outputPath = null;
  try {
    // 1. Validate file presence
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded. Please attach a video or audio file under the field name "file"');
    }

    const { path: inputTempPath, originalname } = req.file;
    const bitrate = req.body.bitrate || '320';

    logger.info(`Received conversion request for file: "${originalname}" (bitrate: ${bitrate}k)`);

    // 2. Prepare unique output filename and destination path
    const outputFilename = `${uuidv4()}.mp3`;
    outputPath = path.join(env.outputDir, outputFilename);

    // 3. Execute FFmpeg conversion asynchronously
    const conversionMeta = await ffmpegService.convertMediaToMp3(
      inputTempPath,
      outputPath,
      bitrate
    );

    // 4. Immediately clean up temporary original uploaded file
    await deleteFileAsync(inputTempPath);

    // 5. Construct download URL
    const downloadUrl = `${env.baseUrl}/api/download/${outputFilename}`;

    // 6. Build FileMetadata model instance
    const metadata = new FileMetadata({
      filename: outputFilename,
      downloadUrl,
      size: conversionMeta.sizeFormatted,
      sizeBytes: conversionMeta.sizeBytes,
      duration: conversionMeta.durationFormatted,
      durationSeconds: conversionMeta.durationSeconds,
      bitrate: `${bitrate}k`
    });

    // 7. Auto-persist to history (MongoDB)
    const displayFilename = originalname ? originalname.replace(/\.[^/.]+$/, "") + ".mp3" : outputFilename;
    await saveHistoryItem({
      filename: displayFilename,
      downloadUrl,
      size: conversionMeta.sizeFormatted,
      sizeBytes: conversionMeta.sizeBytes,
      duration: conversionMeta.durationFormatted,
      durationSeconds: conversionMeta.durationSeconds,
      bitrate: `${bitrate}k`
    });

    // 8. Send standardized JSON response
    return res.status(200).json(metadata.toApiResponse());

  } catch (error) {
    // Clean up temporary upload file and output file on error
    if (req.file && req.file.path) {
      await deleteFileAsync(req.file.path);
    }
    if (outputPath && fs.existsSync(outputPath)) {
      await deleteFileAsync(outputPath);
    }
    next(error);
  }
};

module.exports = {
  convertFile
};
