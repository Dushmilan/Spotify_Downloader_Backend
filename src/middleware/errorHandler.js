const logger = require('../utils/logger');

// Not found handler - for routes that don't exist
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// General error handler
const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error(`${error.name}: ${error.message}`, {
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};