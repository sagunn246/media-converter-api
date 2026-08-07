/**
 * Server Entry Point & Process Lifecycle Listener
 */

const app = require('./app');
const env = require('./config/env.config');
const logger = require('./utils/logger');
const storageService = require('./services/storage.service');
const { connectDB } = require('./config/db');

// Connect to MongoDB Database
connectDB();

// Initialize local storage directories & cleanup services
storageService.initializeStorageDirectories();
storageService.cleanupStaleUploadFiles();
storageService.initScheduledCleanup();

// Start HTTP Server
const server = app.listen(env.port, '0.0.0.0', () => {
  logger.info(`=======================================================`);
  logger.info(` Media Converter API Server Listening on Port : ${env.port}`);
  logger.info(` Environment                            : ${env.nodeEnv}`);
  logger.info(` Base URL                               : ${env.baseUrl}`);
  logger.info(` Maximum Upload Size                    : ${env.maxFileSizeMB} MB`);
  logger.info(` File Retention Duration                : ${env.fileRetentionHours} Hours`);
  logger.info(`=======================================================`);
});

/**
 * Graceful Shutdown Handler
 * @param {string} signal 
 */
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle process shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unexpected errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
