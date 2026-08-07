/**
 * Conversion History API Routes
 */

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');

router.get('/', historyController.getHistory);
router.post('/', historyController.addHistory);
router.delete('/', historyController.clearHistory);

module.exports = router;
