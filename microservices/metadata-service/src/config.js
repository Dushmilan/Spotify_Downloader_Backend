require('dotenv').config();

const config = {
  pythonPath: process.env.PYTHON_PATH || 'python',
  logLevel: process.env.LOG_LEVEL || 'info',
  spotify: {
    scraperTimeout: parseInt(process.env.SPOTIFY_SCRAPER_TIMEOUT) || 30000
  }
};

module.exports = config;