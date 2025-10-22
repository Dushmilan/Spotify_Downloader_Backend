const SpotifyService = require('../services/SpotifyService');
const YouTubeService = require('../services/YouTubeService');
const logger = require('../utils/logger');

class SpotifyController {
  /**
   * Download a Spotify track
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async downloadSpotify(req, res) {
    try {
      const { spotifyUrl } = req.body;

      // Validate inputs
      if (!spotifyUrl) {
        return res.status(400).json({ 
          success: false,
          error: 'Spotify URL is required' 
        });
      }

      if (!SpotifyService.isValidSpotifyUrl(spotifyUrl)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid Spotify URL format' 
        });
      }

      logger.info(`Processing Spotify download request for URL: ${spotifyUrl}`);

      // Extract metadata from Spotify
      logger.info('Extracting metadata from Spotify...');
      const metadata = await SpotifyService.extractMetadata(spotifyUrl);
      
      if (!metadata) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to extract Spotify metadata' 
        });
      }

      // Download from YouTube using the metadata
      logger.info('Downloading from YouTube...');
      const downloadResult = await YouTubeService.downloadFromYouTube(metadata);

      if (downloadResult.success) {
        res.json({ 
          success: true, 
          metadata: metadata,
          downloadPath: `/downloads/${downloadResult.fileName}`,
          message: 'Track downloaded successfully'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: downloadResult.error || 'Failed to download track' 
        });
      }
    } catch (error) {
      logger.error(`Error in downloadSpotify controller: ${error.message}`);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Validate a Spotify URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateSpotifyUrl(req, res) {
    try {
      const { spotifyUrl } = req.body;

      if (!spotifyUrl) {
        return res.status(400).json({ 
          success: false,
          error: 'Spotify URL is required' 
        });
      }

      const isValid = SpotifyService.isValidSpotifyUrl(spotifyUrl);
      
      res.json({
        success: true,
        isValid: isValid,
        message: isValid ? 'Valid Spotify URL' : 'Invalid Spotify URL format'
      });
    } catch (error) {
      logger.error(`Error in validateSpotifyUrl controller: ${error.message}`);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = SpotifyController;