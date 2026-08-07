/**
 * Express Application Assembly & Middleware Pipeline
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env.config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

// Initialize Express application
const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress response bodies
app.use(compression());

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging with Morgan
if (env.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Global General Rate Limiting
app.use(generalLimiter);

// Mount Application Routes
app.use('/', routes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Operational Error Handler
app.use(errorHandler);

module.exports = app;
