/**
 * YouTube Conversion Routes
 */

const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtube.controller');
const { convertLimiter } = require('../middleware/rateLimiter.middleware');

// GET /api/youtube/info?url=  - Fetch video metadata preview
router.get('/info', youtubeController.getVideoInfo);

// POST /api/youtube/convert  - Convert YouTube URL to MP3
router.post('/convert', convertLimiter, youtubeController.convertYoutubeUrl);

module.exports = router;
