const { executePythonScript } = require('../utils/pythonExecutor');
const logger = require('../utils/logger');
const { validateSpotifyUrl } = require('../utils/validation');
const youtubeService = require('./youtubeService'); // Import YouTube service
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
   * Downloads a single track from a Spotify URL
   * @param {string} spotifyUrl - The Spotify URL for the track
   * @param {string} outputPath - Where to save the downloaded file
   * @returns {Promise} - Promise that resolves when download is complete
   */
  async downloadTrack(spotifyUrl, outputPath) {
    try {
      // Validate inputs
      const validation = validateSpotifyUrl(spotifyUrl);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Extract metadata first
      const metadata = await this.extractMetadata(spotifyUrl);
      
      logger.info(`Extracted metadata for track: ${metadata.trackName || metadata.name || 'Unknown Track'}`);
      
      // Format search query from metadata
      const searchQuery = `${metadata.trackName || metadata.name || ''} ${metadata.artist || metadata.artists?.join(' ') || ''}`;
      
      // Fetch YouTube URL using YouTube service
      const youtubeUrl = await youtubeService.fetchYouTubeUrl(searchQuery);
      
      logger.info(`Fetched YouTube URL: ${youtubeUrl}`);
      
      // Download the audio using YouTube service
      const downloadResult = await youtubeService.downloadAudio(youtubeUrl, outputPath);
      
      logger.info(`Successfully downloaded track to: ${outputPath}`);
      
      return {
        metadata,
        youtubeUrl,
        downloadResult,
        outputPath
      };
    } catch (error) {
      logger.error(`Error downloading track: ${error.message}`, {
        spotifyUrl,
        outputPath,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Downloads all tracks from a Spotify playlist
   * @param {string} playlistUrl - The Spotify playlist URL
   * @param {string} baseOutputPath - Base directory to save the downloaded files
   * @returns {Promise} - Promise that resolves when all downloads are complete
   */
  async downloadPlaylist(playlistUrl, baseOutputPath) {
    try {
      // Validate inputs
      const validation = validateSpotifyUrl(playlistUrl);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get playlist tracks
      const tracks = await this.getPlaylistTracks(playlistUrl);
      
      logger.info(`Starting download of ${tracks.length} tracks from playlist`);
      
      const results = [];
      const errors = [];
      
      // Process each track in the playlist
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        try {
          // Format track info for search
          const searchQuery = `${track.trackName || track.name || ''} ${track.artist || track.artists?.join(' ') || ''}`;
          
          // Fetch YouTube URL for this track
          const youtubeUrl = await youtubeService.fetchYouTubeUrl(searchQuery);
          
          // Create specific output path for this track
          // Sanitize filename to avoid issues with special characters
          const sanitizedTrackName = (track.trackName || track.name || `track_${i+1}`)
            .replace(/[<>:"/\\|?*]/g, '_');
          const trackOutputPath = `${baseOutputPath}/${sanitizedTrackName}.mp3`;
          
          // Download the audio
          const downloadResult = await youtubeService.downloadAudio(youtubeUrl, trackOutputPath);
          
          results.push({
            trackIndex: i,
            trackName: track.trackName || track.name || `Track ${i+1}`,
            artist: track.artist || track.artists?.join(', ') || 'Unknown Artist',
            youtubeUrl,
            outputPath: trackOutputPath,
            downloadResult
          });
          
          logger.info(`Downloaded track ${i+1}/${tracks.length}: ${track.trackName || track.name}`);
        } catch (trackError) {
          logger.error(`Failed to download track ${i+1}/${tracks.length}: ${trackError.message}`, {
            track: track.trackName || track.name || `Track ${i+1}`,
            error: trackError.message
          });
          
          errors.push({
            trackIndex: i,
            track: track.trackName || track.name || `Track ${i+1}`,
            error: trackError.message
          });
        }
      }
      
      logger.info(`Playlist download complete. Success: ${results.length}, Errors: ${errors.length}`);
      
      return {
        totalTracks: tracks.length,
        successfulDownloads: results.length,
        failedDownloads: errors.length,
        results,
        errors
      };
    } catch (error) {
      logger.error(`Error downloading playlist: ${error.message}`, {
        playlistUrl,
        baseOutputPath,
        error: error.message
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