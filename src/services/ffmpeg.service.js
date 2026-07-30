/**
 * FFmpeg Audio Conversion & Metadata Extraction Service
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const fs = require('fs');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { formatBytes, formatDuration } = require('../utils/fileHelpers');

// Set binary paths for fluent-ffmpeg fallback if not set globally
try {
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
  logger.info('FFmpeg and FFprobe binary paths successfully initialized');
} catch (err) {
  logger.warn('Could not set installer binary paths, relying on system PATH:', err.message);
}

/**
 * Extract metadata from a media file using FFprobe
 * @param {string} filePath 
 * @returns {Promise<{ durationSeconds: number, durationFormatted: string, sizeBytes: number, sizeFormatted: string }>}
 */
const getMediaMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error(`ffprobe error for file ${filePath}:`, err.message);
        return reject(new ApiError(500, 'Failed to extract media file metadata'));
      }

      const durationSeconds = metadata?.format?.duration || 0;
      const durationFormatted = formatDuration(durationSeconds);

      let sizeBytes = metadata?.format?.size;
      if (!sizeBytes && fs.existsSync(filePath)) {
        sizeBytes = fs.statSync(filePath).size;
      }
      const sizeFormatted = formatBytes(sizeBytes || 0);

      resolve({
        durationSeconds,
        durationFormatted,
        sizeBytes: sizeBytes || 0,
        sizeFormatted
      });
    });
  });
};

/**
 * Convert input media file (video or audio) into MP3 using FFmpeg
 * @param {string} inputPath - Path to original uploaded input file
 * @param {string} outputPath - Path to target converted MP3 file
 * @param {string|number} bitrateKbps - Requested audio bitrate (e.g. 128, 192, 256, 320)
 * @returns {Promise<{ durationFormatted: string, sizeFormatted: string, sizeBytes: number, durationSeconds: number }>}
 */
const convertMediaToMp3 = (inputPath, outputPath, bitrateKbps = 320) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new ApiError(404, 'Source media file not found for conversion'));
    }

    const targetBitrate = `${bitrateKbps}k`;
    logger.info(`Starting FFmpeg conversion: ${inputPath} -> ${outputPath} @ ${targetBitrate}`);

    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate(targetBitrate)
      .on('start', (commandLine) => {
        logger.info(`FFmpeg process started with command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.info(`Processing conversion: ${Math.round(progress.percent)}% done`);
        }
      })
      .on('error', (err, stdout, stderr) => {
        logger.error(`FFmpeg conversion failed: ${err.message}`);
        logger.error(`FFmpeg stderr: ${stderr}`);
        return reject(new ApiError(500, `Media conversion failed: ${err.message}`));
      })
      .on('end', async () => {
        logger.info(`FFmpeg conversion completed successfully: ${outputPath}`);
        try {
          // Extract metadata from newly generated output file
          const meta = await getMediaMetadata(outputPath);
          resolve(meta);
        } catch (metaErr) {
          logger.warn(`Could not read output metadata, falling back to file stat: ${metaErr.message}`);
          const stats = fs.statSync(outputPath);
          resolve({
            durationSeconds: 0,
            durationFormatted: '00:00',
            sizeBytes: stats.size,
            sizeFormatted: formatBytes(stats.size)
          });
        }
      })
      .save(outputPath);
  });
};

module.exports = {
  convertMediaToMp3,
  getMediaMetadata
};
