const { executePythonScript } = require('../utils/pythonExecutor');
const logger = require('../utils/logger');
const { validateSpotifyUrl } = require('../utils/validation');
const path = require('path');

class SpotifyService {
  /**
   * Extracts metadata from a Spotify track/playlist/album
   * @param {string} spotifyUrl - The Spotify URL to extract metadata from
   * @returns {Promise} - Promise that resolves with the metadata
   */
  async extractMetadata(spotifyUrl) {
    // Validate input using utility function
    const validation = validateSpotifyUrl(spotifyUrl);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Get the path to the Python script
      const scriptPath = path.join(__dirname, '../../spotify/spotify_metadata.py');
      
      // Execute the Python script with the Spotify URL as an argument
      const result = await executePythonScript(scriptPath, [spotifyUrl], { timeout: 45000 });
      
      // Validate the output from the Python script
      if (!result) {
        throw new Error('No metadata received from Python script');
      }

      logger.info(`Successfully extracted metadata from Spotify URL: ${spotifyUrl}`);
      return result;
    } catch (error) {
      logger.error(`Error extracting Spotify metadata: ${error.message}`, {
        spotifyUrl,
        error: error.stderr || error.message
      });
      
      throw error;
    }
  }

  /**
   * Gets tracks from a Spotify playlist
   * @param {string} playlistUrl - The Spotify playlist URL
   * @returns {Promise} - Promise that resolves with playlist tracks
   */
  async getPlaylistTracks(playlistUrl) {
    // Validate input using utility function
    const validation = validateSpotifyUrl(playlistUrl);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Additional check to ensure this is a playlist URL
    if (!this.isPlaylistOrAlbumUrl(playlistUrl)) {
      throw new Error('URL must point to a Spotify playlist or album');
    }

    try {
      // Get the path to the Python script
      const scriptPath = path.join(__dirname, '../../spotify/spotify_playlist.py');
      
      // Execute the Python script with the playlist URL as an argument
      const result = await executePythonScript(scriptPath, [playlistUrl], { timeout: 60000 });
      
      // Validate the output from the Python script
      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid playlist data received from Python script');
      }

      logger.info(`Successfully extracted ${result.length} tracks from Spotify playlist: ${playlistUrl}`);
      return result;
    } catch (error) {
      logger.error(`Error extracting Spotify playlist tracks: ${error.message}`, {
        playlistUrl,
        error: error.stderr || error.message
      });
      
      throw error;
    }
  }

  /**
   * Checks if a URL is a playlist or album URL
   * @param {string} url - The URL to check
   * @returns {boolean} - True if the URL is a playlist or album URL
   */
  isPlaylistOrAlbumUrl(url) {
    return url.includes('/playlist/') || url.includes('/album/');
  }
}

module.exports = new SpotifyService();