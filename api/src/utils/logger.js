/**
 * Custom Logger Utility & Morgan Stream Integration
 */

const info = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] [INFO] ${message}`, ...args);
};

const warn = (message, ...args) => {
  console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, ...args);
};

const error = (message, ...args) => {
  console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
};

// Stream object for morgan HTTP logger
const stream = {
  write: (message) => {
    console.log(`[${new Date().toISOString()}] [HTTP] ${message.trim()}`);
  }
};

module.exports = {
  info,
  warn,
  error,
  stream
};
