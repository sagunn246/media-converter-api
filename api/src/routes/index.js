/**
 * Main API Route Aggregator
 */

const express = require('express');
const router = express.Router();

const apiRoutes = require('./api.routes');
const convertRoutes = require('./convert.routes');
const downloadRoutes = require('./download.routes');
const fileRoutes = require('./file.routes');
const youtubeRoutes = require('./youtube.routes');
const historyRoutes = require('./history.routes');

// Root & Health routes mounted at base '/'
router.use('/', apiRoutes);

// Media conversion route
router.use('/api/convert', convertRoutes);

// YouTube URL conversion routes
router.use('/api/youtube', youtubeRoutes);

// File download & streaming route
router.use('/api/download', downloadRoutes);

// File management route
router.use('/api/file', fileRoutes);

// Conversion history route
router.use('/api/history', historyRoutes);

module.exports = router;
