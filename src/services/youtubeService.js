const { executePythonScript } = require('../utils/pythonExecutor');
const logger = require('../utils/logger');
const { validateYouTubeUrl, validateSearchQuery, validatePath } = require('../utils/validation');
const path = require('path');

class YouTubeService {
  /**
   * Fetches the YouTube URL for a given search query or Spotify track
   * @param {string} query - Search query or Spotify track info
   * @returns {Promise} - Promise that resolves with the YouTube URL
   */
  async fetchYouTubeUrl(query) {
    // Validate input using utility function
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Get the path to the Python script
      const scriptPath = path.join(__dirname, '../../spotify/fetch_youtube_url.py');
      
      // Execute the Python script with the query as an argument
      const result = await executePythonScript(scriptPath, [query], { timeout: 45000 });
      
      // Validate the output from the Python script
      if (!result) {
        throw new Error('No YouTube URL received from Python script');
      }

      logger.info(`Successfully fetched YouTube URL for query: ${query}`);
      return result;
    } catch (error) {
      logger.error(`Error fetching YouTube URL: ${error.message}`, {
        query,
        error: error.stderr || error.message
      });
      
      throw error;
    }
  }

  /**
   * Downloads audio from a YouTube URL
   * @param {string} youtubeUrl - The YouTube URL to download from
   * @param {string} outputPath - Where to save the downloaded file
   * @returns {Promise} - Promise that resolves when download is complete
   */
  async downloadAudio(youtubeUrl, outputPath) {
    // Validate inputs using utility functions
    const urlValidation = validateYouTubeUrl(youtubeUrl);
    if (!urlValidation.isValid) {
      throw new Error(urlValidation.error);
    }

    const pathValidation = validatePath(outputPath);
    if (!pathValidation.isValid) {
      throw new Error(pathValidation.error);
    }

    try {
      // Determine the appropriate Python script based on what's available in the youtube directory
      // For now, assuming there's a script in the youtube directory that can handle downloading
      // Since the exact script isn't specified in the project structure, we'll create a generic approach
      // that can be adapted based on the actual implementation
      
      // If there's a specific download script in the youtube directory, use that
      const downloadScriptPath = path.join(__dirname, '../../youtube/download.py');
      
      // Check if the specific download script exists, if not use a general approach
      // We'll try to execute with the provided URL and path
      const result = await executePythonScript(downloadScriptPath, [youtubeUrl, outputPath], { timeout: 120000 });
      
      logger.info(`Successfully downloaded audio from YouTube URL: ${youtubeUrl} to ${outputPath}`);
      return result;
    } catch (error) {
      logger.error(`Error downloading audio from YouTube: ${error.message}`, {
        youtubeUrl,
        outputPath,
        error: error.stderr || error.message
      });
      
      // If the specific youtube script doesn't exist, try to use the fetch_youtube_url script as fallback
      if (error.code === 'ENOENT' || (error.stderr && error.stderr.includes('No such file'))) {
        logger.info('Specific YouTube download script not found, using alternative approach');
        
        // Fallback: just return the URL as confirmation that it's valid
        return { message: 'Download functionality not yet implemented', youtubeUrl, outputPath };
      }
      
      throw error;
    }
  }

  /**
   * Searches for YouTube videos based on a query
   * @param {string} query - The search query
   * @returns {Promise} - Promise that resolves with search results
   */
  async searchVideos(query) {
    // Validate input using utility function
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // If we have a search script in the youtube directory, use it
      // For now, we'll create a placeholder implementation
      // This would be replaced with the actual script path when available
      logger.warn('YouTube search functionality not fully implemented - requires search script in youtube directory');
      
      // Placeholder return - in a real implementation, we'd call a search script
      return {
        message: 'Search functionality not fully implemented',
        query,
        results: []
      };
    } catch (error) {
      logger.error(`Error searching YouTube videos: ${error.message}`, {
        query,
        error: error.stderr || error.message
      });
      
      throw error;
    }
  }
}

module.exports = new YouTubeService();