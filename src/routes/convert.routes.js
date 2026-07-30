/**
 * Conversion Route Definition
 */

const express = require('express');
const router = express.Router();
const convertController = require('../controllers/convert.controller');
const { uploadSingleFile } = require('../middleware/upload.middleware');
const { validateConversionInput } = require('../middleware/validate.middleware');
const { convertLimiter } = require('../middleware/rateLimiter.middleware');

router.post(
  '/',
  convertLimiter,
  uploadSingleFile,
  validateConversionInput,
  convertController.convertFile
);

module.exports = router;
