/**
 * YouTube Audio Downloader & Converter Service
 */

const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const fs = require('fs');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { formatBytes, formatDuration } = require('../utils/fileHelpers');
const { getMediaMetadata } = require('./ffmpeg.service');

try {
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
} catch (err) {
  logger.warn('Could not set installer binary paths in ytdl service:', err.message);
}

/**
 * Validates YouTube URL
 * @param {string} url 
 * @returns {boolean}
 */
const isValidYoutubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return ytdl.validateURL(url);
};

/**
 * Fetch video details/info from YouTube
 * @param {string} url 
 */
const getYoutubeInfo = async (url) => {
  if (!isValidYoutubeUrl(url)) {
    throw new ApiError(400, 'Invalid YouTube URL. Please provide a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)');
  }

  try {
    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    return {
      title: details.title,
      author: details.author?.name || 'Unknown Artist',
      durationSeconds: parseInt(details.lengthSeconds || '0', 10),
      durationFormatted: formatDuration(parseInt(details.lengthSeconds || '0', 10)),
      thumbnail: details.thumbnails?.[details.thumbnails.length - 1]?.url || '',
      viewCount: details.viewCount,
      videoUrl: details.video_url
    };
  } catch (err) {
    logger.error(`ytdl getInfo error for URL ${url}:`, err.message);
    throw new ApiError(400, `Failed to retrieve YouTube video details: ${err.message}`);
  }
};

/**
 * Download YouTube video audio stream & convert to MP3 via FFmpeg
 * @param {string} url 
 * @param {string} outputPath 
 * @param {string|number} bitrateKbps 
 */
const convertYoutubeToMp3 = (url, outputPath, bitrateKbps = 320) => {
  return new Promise((resolve, reject) => {
    if (!isValidYoutubeUrl(url)) {
      return reject(new ApiError(400, 'Invalid YouTube URL provided for conversion'));
    }

    const targetBitrate = `${bitrateKbps}k`;
    logger.info(`Starting YouTube audio extraction: ${url} -> ${outputPath} @ ${targetBitrate}`);

    try {
      const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25 // 32MB buffer
      });

      audioStream.on('error', (err) => {
        logger.error(`ytdl stream error: ${err.message}`);
        reject(new ApiError(500, `Failed to stream YouTube audio: ${err.message}`));
      });

      ffmpeg(audioStream)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(targetBitrate)
        .on('start', (cmd) => {
          logger.info(`FFmpeg process started for YouTube stream: ${cmd}`);
        })
        .on('error', (err, stdout, stderr) => {
          logger.error(`FFmpeg YouTube conversion error: ${err.message}`);
          return reject(new ApiError(500, `YouTube conversion failed: ${err.message}`));
        })
        .on('end', async () => {
          logger.info(`YouTube audio conversion completed: ${outputPath}`);
          try {
            const meta = await getMediaMetadata(outputPath);
            resolve(meta);
          } catch (metaErr) {
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

    } catch (err) {
      logger.error(`Error initializing YouTube stream conversion: ${err.message}`);
      reject(new ApiError(500, `YouTube processing error: ${err.message}`));
    }
  });
};

module.exports = {
  isValidYoutubeUrl,
  getYoutubeInfo,
  convertYoutubeToMp3
};
