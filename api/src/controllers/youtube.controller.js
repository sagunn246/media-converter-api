/**
 * YouTube URL Conversion Controller
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env.config');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const ytdlService = require('../services/ytdl.service');
const { deleteFileAsync } = require('../utils/fileHelpers');
const FileMetadata = require('../models/fileMetadata.model');
const { saveHistoryItem } = require('./history.controller');

/**
 * GET /api/youtube/info?url=
 * Returns video title, author, duration, and thumbnail from a YouTube URL
 */
const getVideoInfo = async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url) {
      throw new ApiError(400, 'Missing required query parameter: url');
    }

    logger.info(`Fetching YouTube video info for URL: ${url}`);
    const info = await ytdlService.getYoutubeInfo(url);

    return res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/youtube/convert
 * Accepts a YouTube URL and bitrate, streams audio and converts to MP3
 */
const convertYoutubeUrl = async (req, res, next) => {
  try {
    const { url, bitrate = '320' } = req.body;

    if (!url) {
      throw new ApiError(400, 'Missing required field: url');
    }

    if (!ytdlService.isValidYoutubeUrl(url)) {
      throw new ApiError(400, 'Invalid YouTube URL. Please provide a valid YouTube video link.');
    }

    logger.info(`YouTube conversion request: "${url}" (bitrate: ${bitrate}k)`);

    // Get video info first for metadata
    const videoInfo = await ytdlService.getYoutubeInfo(url);

    // Prepare output path
    const outputFilename = `${uuidv4()}.mp3`;
    const outputPath = path.join(env.outputDir, outputFilename);

    // Convert YouTube audio stream to MP3
    const conversionMeta = await ytdlService.convertYoutubeToMp3(url, outputPath, bitrate);

    // Construct download URL
    const downloadUrl = `${env.baseUrl}/api/download/${outputFilename}`;

    // Build response metadata
    const metadata = new FileMetadata({
      filename: outputFilename,
      downloadUrl,
      size: conversionMeta.sizeFormatted,
      sizeBytes: conversionMeta.sizeBytes,
      duration: videoInfo.durationFormatted || conversionMeta.durationFormatted,
      durationSeconds: videoInfo.durationSeconds || conversionMeta.durationSeconds,
      bitrate: `${bitrate}k`
    });

    const apiMeta = metadata.toApiResponse();
    const fullPayload = {
      ...apiMeta.data,
      videoTitle: videoInfo.title,
      videoAuthor: videoInfo.author,
      thumbnail: videoInfo.thumbnail
    };

    // Auto-persist to history (MongoDB)
    const displayTitle = videoInfo.title ? videoInfo.title.replace(/\.mp3$/i, "") + ".mp3" : outputFilename;
    await saveHistoryItem({
      filename: displayTitle,
      downloadUrl,
      size: conversionMeta.sizeFormatted,
      sizeBytes: conversionMeta.sizeBytes,
      duration: videoInfo.durationFormatted || conversionMeta.durationFormatted,
      durationSeconds: videoInfo.durationSeconds || conversionMeta.durationSeconds,
      bitrate: `${bitrate}k`,
      videoTitle: videoInfo.title
    });

    return res.status(200).json({
      success: true,
      data: fullPayload,
      ...fullPayload
    });

  } catch (error) {
    if (outputPath && fs.existsSync(outputPath)) {
      await deleteFileAsync(outputPath);
    }
    next(error);
  }
};

module.exports = {
  getVideoInfo,
  convertYoutubeUrl
};
