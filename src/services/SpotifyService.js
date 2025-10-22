const PythonService = require('./PythonService');
const logger = require('../utils/logger');
const config = require('../config');

class SpotifyService {
  /**
   * Extract metadata from a Spotify URL
   * @param {string} spotifyUrl - The Spotify track URL
   * @returns {Promise<Object>} - Promise that resolves with track metadata
   */
  static async extractMetadata(spotifyUrl) {
    logger.info(`Extracting metadata from Spotify URL: ${spotifyUrl}`);

    try {
      // Validate inputs
      if (!spotifyUrl) {
        throw new Error('Spotify URL is required');
      }

      // Check if Python is available
      const pythonAvailable = await PythonService.isPythonAvailable();
      if (!pythonAvailable) {
        throw new Error('Python is not available. Please install Python and add it to your PATH.');
      }

      // Execute the Python metadata extractor script
      const result = await PythonService.executeScript(
        config.pythonScripts.metadataExtractor,
        [spotifyUrl]
      );

      logger.info('Successfully extracted Spotify metadata');
      return result;
    } catch (error) {
      logger.error(`Error extracting Spotify metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate Spotify URL format
   * @param {string} url - The URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static isValidSpotifyUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('spotify.com') || 
             parsedUrl.hostname.includes('open.spotify.com');
    } catch (error) {
      return false;
    }
  }
}

module.exports = SpotifyService;