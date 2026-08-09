/**
 * YouTube Audio Downloader & Converter Service
 */

const ytdl = require('@distube/ytdl-core');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const fs = require('fs');
const path = require('path');
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

const ffmpegBinDir = path.dirname(ffmpegPath);
const os = require('os');

/**
 * Writes YOUTUBE_COOKIES env var to a temp file for yt-dlp cookie auth.
 * Returns the path if written, null otherwise.
 */
const getCookiesFilePath = () => {
  const cookiesContent = process.env.YOUTUBE_COOKIES;
  if (!cookiesContent || !cookiesContent.trim()) return null;
  try {
    // Render stores multiline env vars with literal \n — replace with real newlines
    const normalized = cookiesContent.replace(/\\n/g, '\n').trim();
    const cookiesPath = path.join(os.tmpdir(), 'yt-cookies.txt');
    fs.writeFileSync(cookiesPath, normalized + '\n', 'utf8');
    logger.info(`YouTube cookies written to: ${cookiesPath} (${normalized.split('\n').length} lines)`);
    return cookiesPath;
  } catch (err) {
    logger.warn('Could not write YouTube cookies to temp file:', err.message);
    return null;
  }
};

const YTDL_REQUEST_OPTIONS = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate'
  }
};

/**
 * Validates YouTube URL
 * @param {string} url 
 * @returns {boolean}
 */
const isValidYoutubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const youtubeRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i;
  return youtubeRegex.test(trimmed) || ytdl.validateURL(trimmed);
};

const play = require('play-dl');

/**
 * Fetch video details/info from YouTube
 * @param {string} url 
 */
const getYoutubeInfo = async (url) => {
  const cleanUrl = url ? url.trim() : '';
  if (!isValidYoutubeUrl(cleanUrl)) {
    throw new ApiError(400, 'Invalid YouTube URL. Please provide a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)');
  }

  // 1. Try YouTube Official oEmbed API first (100% immune to bot checks & 429 rate limits)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const oembed = await response.json();
      if (oembed && oembed.title) {
        logger.info(`Fetched YouTube info via official oEmbed API: "${oembed.title}"`);
        return {
          title: oembed.title,
          author: oembed.author_name || 'Unknown Artist',
          durationSeconds: 0,
          durationFormatted: 'Audio Stream',
          thumbnail: oembed.thumbnail_url || '',
          viewCount: 0,
          videoUrl: cleanUrl
        };
      }
    }
  } catch (oembedErr) {
    logger.warn(`oEmbed fetch failed, attempting yt-dlp fallback: ${oembedErr.message}`);
  }

  // 2. Fallback to youtube-dl-exec (native yt-dlp binary with cookie auth + player_client bypass)
  try {
    const cookiesFile = getCookiesFilePath();
    const ytdlInfoOpts = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      noPlaylist: true,
      preferFreeFormats: true,
      extractorArgs: 'youtube:player_client=mweb,tv,ios',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
      ffmpegLocation: ffmpegBinDir
    };
    if (cookiesFile) {
      ytdlInfoOpts.cookies = cookiesFile;
      logger.info('Using YouTube cookies for yt-dlp info request');
    }
    const output = await youtubedl(cleanUrl, ytdlInfoOpts);

    const durationSec = Math.round(output.duration || 0);
    return {
      title: output.title || output.fulltitle || 'YouTube Audio',
      author: output.uploader || output.channel || output.creator || 'Unknown Artist',
      durationSeconds: durationSec,
      durationFormatted: formatDuration(durationSec),
      thumbnail: output.thumbnail || (output.thumbnails && output.thumbnails.length ? output.thumbnails[output.thumbnails.length - 1].url : ''),
      viewCount: output.view_count || 0,
      videoUrl: output.webpage_url || cleanUrl
    };
  } catch (ytDlErr) {
    logger.warn(`youtube-dl-exec info failed, attempting play-dl fallback: ${ytDlErr.message}`);
  }

  // 2. Try play-dl info (bypasses cloud data-center IP rate-limits)
  try {
    const info = await play.video_info(cleanUrl);
    const details = info.video_details;
    const thumbnails = details.thumbnails || [];
    const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

    return {
      title: details.title || 'YouTube Audio',
      author: details.channel?.name || 'Unknown Artist',
      durationSeconds: details.durationInSec || 0,
      durationFormatted: formatDuration(details.durationInSec || 0),
      thumbnail,
      viewCount: details.views || 0,
      videoUrl: details.url || cleanUrl
    };
  } catch (playErr) {
    logger.warn(`play-dl info error: ${playErr.message}`);
  }

  // 3. Fallback to ytdl-core info
  try {
    const info = await ytdl.getInfo(cleanUrl, { requestOptions: YTDL_REQUEST_OPTIONS });
    const details = info.videoDetails;
    const thumbnails = details.thumbnails || [];
    const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

    return {
      title: details.title,
      author: details.author?.name || 'Unknown Artist',
      durationSeconds: parseInt(details.lengthSeconds || '0', 10),
      durationFormatted: formatDuration(parseInt(details.lengthSeconds || '0', 10)),
      thumbnail,
      viewCount: details.viewCount,
      videoUrl: details.video_url
    };
  } catch (err) {
    logger.error(`ytdl getInfo error for URL ${cleanUrl}:`, err.message);
    const msg = err.message.includes('429') 
      ? 'YouTube server rate limited requests (HTTP 429). Please wait a minute and try again.'
      : `Failed to retrieve YouTube video details: ${err.message}`;
    throw new ApiError(400, msg);
  }
};

/**
 * Download YouTube video audio stream & convert to MP3 via FFmpeg
 * @param {string} url 
 * @param {string} outputPath 
 * @param {string|number} bitrateKbps 
 */
const convertYoutubeToMp3 = async (url, outputPath, bitrateKbps = 320) => {
  const cleanUrl = url ? url.trim() : '';
  if (!isValidYoutubeUrl(cleanUrl)) {
    throw new ApiError(400, 'Invalid YouTube URL provided for conversion');
  }

  const targetBitrateNum = parseInt(bitrateKbps, 10) || 320;
  const targetBitrateStr = `${targetBitrateNum}k`;
  logger.info(`Starting YouTube audio extraction: ${cleanUrl} -> ${outputPath} @ ${targetBitrateStr}`);

  // 1. Primary Strategy: youtube-dl-exec (native yt-dlp binary, with cookie auth + bot bypass)
  try {
    const cookiesFile = getCookiesFilePath();
    const convertOpts = {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: targetBitrateStr,
      output: outputPath,
      noPlaylist: true,
      extractorArgs: 'youtube:player_client=mweb,tv,ios',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
      ffmpegLocation: ffmpegBinDir,
      noWarnings: true
    };
    if (cookiesFile) {
      convertOpts.cookies = cookiesFile;
      logger.info('Using YouTube cookies for yt-dlp conversion request');
    }
    await youtubedl(cleanUrl, convertOpts);
  } catch (ytExecErr) {
    logger.warn(`youtube-dl-exec execution note: ${ytExecErr.message}`);
  }

  // Handle double .mp3 extension if yt-dlp appended it automatically
  const doubleExtPath = `${outputPath}.mp3`;
  if (!fs.existsSync(outputPath) && fs.existsSync(doubleExtPath)) {
    try {
      fs.renameSync(doubleExtPath, outputPath);
    } catch (renameErr) {
      logger.warn(`Could not rename double extension file: ${renameErr.message}`);
    }
  }

  // If the file was successfully created on disk, return metadata immediately!
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    logger.info(`YouTube audio conversion completed via youtube-dl-exec: ${outputPath}`);
    try {
      const meta = await getMediaMetadata(outputPath);
      return meta;
    } catch (metaErr) {
      const stats = fs.statSync(outputPath);
      return {
        durationSeconds: 0,
        durationFormatted: '00:00',
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size)
      };
    }
  }


  // 2. Secondary Strategy: play-dl audio stream into FFmpeg (bypasses 429 & cloud IP blocks)
  try {
    const playStream = await play.stream(cleanUrl, { quality: 2 });
    await new Promise((resolve, reject) => {
      ffmpeg(playStream.stream)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(targetBitrateStr)
        .on('start', (cmd) => logger.info(`FFmpeg process started for play-dl stream: ${cmd}`))
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(outputPath);
    });

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      logger.info(`YouTube audio conversion completed via play-dl: ${outputPath}`);
      try {
        const meta = await getMediaMetadata(outputPath);
        return meta;
      } catch (metaErr) {
        const stats = fs.statSync(outputPath);
        return {
          durationSeconds: 0,
          durationFormatted: '00:00',
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size)
        };
      }
    }
  } catch (playStreamErr) {
    logger.warn(`play-dl stream conversion failed: ${playStreamErr.message}`);
  }

  // 3. Tertiary Fallback: ytdl-core stream into FFmpeg
  return new Promise(async (resolve, reject) => {
    let isHandled = false;

    const cleanupAndReject = (error) => {
      if (isHandled) return;
      isHandled = true;
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, () => {});
      }
      reject(error);
    };

    try {
      const info = await ytdl.getInfo(cleanUrl, { requestOptions: YTDL_REQUEST_OPTIONS });

      let selectedFormat;
      try {
        selectedFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
      } catch (e1) {
        try {
          selectedFormat = ytdl.chooseFormat(info.formats, { filter: (f) => f.hasAudio });
        } catch (e2) {
          selectedFormat = undefined;
        }
      }

      const streamOptions = {
        highWaterMark: 1 << 25,
        requestOptions: YTDL_REQUEST_OPTIONS
      };

      if (selectedFormat) {
        streamOptions.format = selectedFormat;
      } else {
        streamOptions.quality = 'highestaudio';
        streamOptions.filter = 'audioonly';
      }

      const audioStream = ytdl.downloadFromInfo(info, streamOptions);

      audioStream.on('error', (err) => {
        logger.error(`ytdl stream error: ${err.message}`);
        if (typeof audioStream.destroy === 'function') {
          audioStream.destroy();
        }
        cleanupAndReject(new ApiError(500, `Failed to stream YouTube audio: ${err.message}`));
      });

      ffmpeg(audioStream)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(targetBitrateStr)
        .on('start', (cmd) => {
          logger.info(`FFmpeg process started for YouTube stream: ${cmd}`);
        })
        .on('error', (err) => {
          logger.error(`FFmpeg YouTube conversion error: ${err.message}`);
          if (typeof audioStream.destroy === 'function') {
            audioStream.destroy();
          }
          cleanupAndReject(new ApiError(500, `YouTube conversion failed: ${err.message}`));
        })
        .on('end', async () => {
          if (isHandled) return;
          isHandled = true;
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
      cleanupAndReject(new ApiError(500, `YouTube processing error: ${err.message}`));
    }
  });
};

module.exports = {
  isValidYoutubeUrl,
  getYoutubeInfo,
  convertYoutubeToMp3
};

