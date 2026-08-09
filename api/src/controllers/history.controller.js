/**
 * Conversion History Controller (MongoDB Persisted)
 */

const mongoose = require('mongoose');
const History = require('../models/history.model');
const logger = require('../utils/logger');

/**
 * GET /api/history
 * Fetch top 10 recent conversion history items from MongoDB
 */
const getHistory = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.warn('MongoDB disconnected. Returning empty history array.');
      return res.status(200).json({ success: true, data: [] });
    }

    const historyItems = await History.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formatted = historyItems.map((item) => ({
      id: item._id ? item._id.toString() : String(Math.random()),
      filename: item.filename,
      downloadUrl: item.downloadUrl,
      bitrate: item.bitrate,
      size: item.size,
      duration: item.duration,
      durationSeconds: item.durationSeconds,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    logger.warn('Error fetching history from MongoDB (returning empty history):', error.message);
    return res.status(200).json({
      success: true,
      data: [],
    });
  }
};

/**
 * Save a conversion history item into MongoDB
 */
const saveHistoryItem = async (data) => {
  if (!data || (!data.filename && !data.downloadUrl)) return null;

  const payload = {
    filename: data.filename || 'Converted Audio.mp3',
    downloadUrl: data.downloadUrl,
    bitrate: data.bitrate || '320k',
    size: data.size || '',
    duration: data.duration || '',
    durationSeconds: data.durationSeconds || 0,
    videoTitle: data.videoTitle || data.filename || '',
    createdAt: new Date(),
  };

  try {
    if (mongoose.connection.readyState !== 0) {
      await History.deleteMany({
        $or: [{ filename: payload.filename }, { downloadUrl: payload.downloadUrl }],
      });
      const record = await History.create(payload);
      logger.info(`Saved conversion history to MongoDB: "${payload.filename}"`);
      return record;
    }
  } catch (err) {
    logger.warn('Failed to save history item to MongoDB:', err.message);
  }

  return payload;
};

/**
 * POST /api/history
 * Route handler to record a conversion item
 */
const addHistory = async (req, res, next) => {
  try {
    const item = await saveHistoryItem(req.body);
    return res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history
 * Clear conversion history from MongoDB
 */
const clearHistory = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await History.deleteMany({});
      logger.info('Cleared conversion history from MongoDB');
    }

    return res.status(200).json({
      success: true,
      message: 'History cleared successfully',
    });
  } catch (error) {
    logger.warn('Error clearing history from MongoDB:', error.message);
    return res.status(200).json({
      success: true,
      message: 'History clear operation completed',
    });
  }
};

module.exports = {
  getHistory,
  addHistory,
  saveHistoryItem,
  clearHistory,
};

