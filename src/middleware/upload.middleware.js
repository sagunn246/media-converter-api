/**
 * Multer File Upload Middleware
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env.config');
const { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } = require('../config/constants');
const ApiError = require('../utils/apiError');

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

// File filter function to validate format before upload
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime) || mime.startsWith('video/') || mime.startsWith('audio/');

  if (isExtAllowed && isMimeAllowed) {
    return cb(null, true);
  }

  const allowedFormatsMsg = ALLOWED_EXTENSIONS.join(', ');
  return cb(
    new ApiError(
      400,
      `Unsupported file format '${ext || 'unknown'}'. Supported formats are: ${allowedFormatsMsg}`
    ),
    false
  );
};

// Initialize Multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeMB * 1024 * 1024 // 500MB limit
  },
  fileFilter
});

// Middleware helper for single file field named 'file'
const uploadSingleFile = upload.single('file');

module.exports = {
  uploadSingleFile
};
