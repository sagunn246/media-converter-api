/**
 * File Management Route Definition
 */

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');

router.delete('/:filename', fileController.deleteConvertedFile);

module.exports = router;
