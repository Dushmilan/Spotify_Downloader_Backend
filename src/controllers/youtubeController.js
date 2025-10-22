const YouTubeService = require('../services/YouTubeService');
const logger = require('../utils/logger');

class YouTubeController {
  /**
   * Download directly from YouTube URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async downloadYouTube(req, res) {
    try {
      const { youtubeUrl } = req.body;

      // Validate inputs
      if (!youtubeUrl) {
        return res.status(400).json({ 
          success: false,
          error: 'YouTube URL is required' 
        });
      }

      if (!YouTubeService.isValidYouTubeUrl(youtubeUrl)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid YouTube URL format' 
        });
      }

      logger.info(`Processing YouTube download request for URL: ${youtubeUrl}`);

      // Download directly from YouTube URL
      const downloadResult = await YouTubeService.downloadFromYouTubeUrl(youtubeUrl);

      if (downloadResult.success) {
        res.json({ 
          success: true, 
          downloadPath: `/downloads/${downloadResult.fileName}`,
          message: 'Video downloaded successfully'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: downloadResult.error || 'Failed to download video' 
        });
      }
    } catch (error) {
      logger.error(`Error in downloadYouTube controller: ${error.message}`);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Validate a YouTube URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateYouTubeUrl(req, res) {
    try {
      const { youtubeUrl } = req.body;

      if (!youtubeUrl) {
        return res.status(400).json({ 
          success: false,
          error: 'YouTube URL is required' 
        });
      }

      const isValid = YouTubeService.isValidYouTubeUrl(youtubeUrl);
      
      res.json({
        success: true,
        isValid: isValid,
        message: isValid ? 'Valid YouTube URL' : 'Invalid YouTube URL format'
      });
    } catch (error) {
      logger.error(`Error in validateYouTubeUrl controller: ${error.message}`);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = YouTubeController;