/**
 * Root & Health API Routes
 */

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');

router.get('/', apiController.getApiStatus);
router.get('/health', apiController.getHealthCheck);

module.exports = router;
