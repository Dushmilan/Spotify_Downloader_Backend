const config = require('./default');

// Load environment variables from .env file if present
require('dotenv').config();

module.exports = {
  ...config,
  port: process.env.PORT || config.port,
  pythonPath: process.env.PYTHON_PATH || config.pythonPath,
  downloadsDir: process.env.DOWNLOADS_DIR || config.downloadsDir,
  logLevel: process.env.LOG_LEVEL || config.logLevel,
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || config.spotify.clientId,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || config.spotify.clientSecret,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || config.spotify.redirectUri
  }
};