/**
 * Application Constants
 */

const path = require('path');

// Supported file extensions for media conversion
const ALLOWED_EXTENSIONS = [
  'mp4',
  'mov',
  'avi',
  'mkv',
  'webm',
  'mp3',
  'wav',
  'aac',
  'm4a'
];

// Supported MIME types matching target audio and video formats
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/x-aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'application/octet-stream' // Fallback for certain mobile/OS uploads with generic mime
];

// Allowed MP3 bitrates (in kbps)
const ALLOWED_BITRATES = ['128', '192', '256', '320'];
const DEFAULT_BITRATE = '320';

// Maximum upload file size in bytes (500 MB)
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

// Default directory paths
const UPLOADS_DIR_PATH = path.join(__dirname, '../../uploads');
const OUTPUT_DIR_PATH = path.join(__dirname, '../../output');

module.exports = {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  ALLOWED_BITRATES,
  DEFAULT_BITRATE,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_DIR_PATH,
  OUTPUT_DIR_PATH
};
