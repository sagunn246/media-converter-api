/**
 * MongoDB Database Connection Manager
 */

const mongoose = require('mongoose');
const env = require('./env.config');
const logger = require('../utils/logger');

let isConnected = false;

/**
 * Connects to MongoDB database using Mongoose
 */
const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    logger.warn(`MongoDB Connection Warning: ${error.message}. Running in fallback mode.`);
    isConnected = false;
  }
};

/**
 * Returns whether database is connected
 */
const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected
};
