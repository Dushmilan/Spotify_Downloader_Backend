const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error occurred: ${err.message}`, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code based on error type
  const statusCode = err.statusCode || 500;
  
  // Send response based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, don't send internal error details
    res.status(statusCode).json({
      success: false,
      error: statusCode === 500 ? 'Internal Server Error' : err.message
    });
  } else {
    // In development, send detailed error information
    res.status(statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler
};