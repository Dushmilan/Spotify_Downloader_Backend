const logger = require('../utils/logger');

// Validation middleware
const validation = {
  /**
   * Validate the body of a Spotify request
   */
  validateSpotifyBody: (req, res, next) => {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({
        success: false,
        error: 'Spotify URL is required in the request body'
      });
    }

    next();
  },

  /**
   * Validate the body of a YouTube request
   */
  validateYouTubeBody: (req, res, next) => {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required in the request body'
      });
    }

    next();
  },

  /**
   * Generic input sanitizer
   */
  sanitizeInput: (req, res, next) => {
    // Basic sanitization - remove potentially harmful characters
    if (req.body.spotifyUrl) {
      req.body.spotifyUrl = req.body.spotifyUrl.trim();
    }
    if (req.body.youtubeUrl) {
      req.body.youtubeUrl = req.body.youtubeUrl.trim();
    }
    
    next();
  }
};

module.exports = validation;