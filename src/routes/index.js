/**
 * Main API Route Aggregator
 */

const express = require('express');
const router = express.Router();

const apiRoutes = require('./api.routes');
const convertRoutes = require('./convert.routes');
const downloadRoutes = require('./download.routes');
const fileRoutes = require('./file.routes');

// Root & Health routes mounted at base '/'
router.use('/', apiRoutes);

// Media conversion route
router.use('/api/convert', convertRoutes);

// File download & streaming route
router.use('/api/download', downloadRoutes);

// File management route
router.use('/api/file', fileRoutes);

module.exports = router;
