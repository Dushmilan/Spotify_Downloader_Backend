// Configuration file
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  pythonPath: process.env.PYTHON_PATH || 'python',
  logLevel: process.env.LOG_LEVEL || 'info',
  timeout: {
    pythonScript: parseInt(process.env.PYTHON_SCRIPT_TIMEOUT) || 30000, // 30 seconds default
    request: parseInt(process.env.REQUEST_TIMEOUT) || 60000 // 60 seconds default
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
};

module.exports = config;