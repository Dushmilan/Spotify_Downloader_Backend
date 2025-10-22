const PythonService = require('./PythonService');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class YouTubeService {
  /**
   * Download audio from YouTube based on track metadata
   * @param {Object} metadata - Track metadata containing title and artist
   * @returns {Promise<Object>} - Promise that resolves with download result
   */
  static async downloadFromYouTube(metadata) {
    logger.info(`Downloading from YouTube for track: ${metadata.title} by ${metadata.artist}`);

    try {
      // Validate inputs
      if (!metadata || !metadata.title || !metadata.artist) {
        throw new Error('Track title and artist are required');
      }

      const downloadsDir = path.join(__dirname, '../../', config.downloadsDir);
      
      // Ensure downloads directory exists
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Execute the Python YouTube downloader script
      const result = await PythonService.executeScript(
        config.pythonScripts.youtubeDownloader,
        [metadata.title, metadata.artist, downloadsDir]
      );

      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir);
      const audioFile = files.find(file => file.endsWith('.mp3'));

      if (audioFile) {
        logger.info(`Successfully downloaded audio file: ${audioFile}`);
        return {
          success: true,
          filePath: path.join(config.downloadsDir, audioFile),
          fileName: audioFile
        };
      } else {
        throw new Error('Audio file not found after download');
      }
    } catch (error) {
      logger.error(`Error downloading from YouTube: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download directly from YouTube URL
   * @param {string} youtubeUrl - The YouTube URL to download from
   * @returns {Promise<Object>} - Promise that resolves with download result
   */
  static async downloadFromYouTubeUrl(youtubeUrl) {
    logger.info(`Downloading directly from YouTube URL: ${youtubeUrl}`);

    try {
      if (!youtubeUrl) {
        throw new Error('YouTube URL is required');
      }

      const downloadsDir = path.join(__dirname, '../../', config.downloadsDir);
      
      // Ensure downloads directory exists
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Execute the Python YouTube downloader script with URL
      const result = await PythonService.executeScript(
        config.pythonScripts.youtubeDownloader,
        [youtubeUrl, downloadsDir]
      );

      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir);
      const audioFile = files.filter(file => file.endsWith('.mp3')).pop(); // Get the most recent file

      if (audioFile) {
        logger.info(`Successfully downloaded audio file from URL: ${audioFile}`);
        return {
          success: true,
          filePath: path.join(config.downloadsDir, audioFile),
          fileName: audioFile
        };
      } else {
        throw new Error('Audio file not found after download');
      }
    } catch (error) {
      logger.error(`Error downloading from YouTube URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate YouTube URL format
   * @param {string} url - The URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static isValidYouTubeUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('youtube.com') || 
             parsedUrl.hostname.includes('youtu.be');
    } catch (error) {
      return false;
    }
  }
}

module.exports = YouTubeService;