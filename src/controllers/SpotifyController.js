const spotifyService = require('../services/spotifyService');
const logger = require('../utils/logger');
const { validateSpotifyUrl } = require('../utils/validation');

// Controller for Spotify metadata extraction
const getSpotifyMetadata = async (req, res) => {
  try {
    const { url } = req.query;

    // Validate query parameter
    if (!url) {
      return res.status(400).json({ 
        error: 'Spotify URL is required as a query parameter' 
      });
    }

    // Additional validation using utility
    const validation = validateSpotifyUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Extract metadata using the service
    const metadata = await spotifyService.extractMetadata(url);
    
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error(`Error in getSpotifyMetadata controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Controller for getting Spotify playlist tracks
const getSpotifyPlaylist = async (req, res) => {
  try {
    const { url } = req.query;

    // Validate query parameter
    if (!url) {
      return res.status(400).json({ 
        error: 'Spotify playlist URL is required as a query parameter' 
      });
    }

    // Additional validation using utility
    const validation = validateSpotifyUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Get playlist tracks using the service
    const tracks = await spotifyService.getPlaylistTracks(url);
    
    res.status(200).json({
      success: true,
      data: tracks,
      count: tracks.length
    });
  } catch (error) {
    logger.error(`Error in getSpotifyPlaylist controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Controller for downloading a single Spotify track
const downloadSpotifyTrack = async (req, res) => {
  try {
    const { url, outputPath } = req.body;

    // Validate request body
    if (!url) {
      return res.status(400).json({ 
        error: 'Spotify URL is required in the request body' 
      });
    }

    if (!outputPath) {
      return res.status(400).json({ 
        error: 'Output path is required in the request body' 
      });
    }

    // Additional validation using utility
    const validation = validateSpotifyUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Download the track using the service
    const result = await spotifyService.downloadTrack(url, outputPath);
    
    res.status(200).json({
      success: true,
      message: 'Track downloaded successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Error in downloadSpotifyTrack controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Controller for downloading a Spotify playlist
const downloadSpotifyPlaylist = async (req, res) => {
  try {
    const { url, outputPath } = req.body;

    // Validate request body
    if (!url) {
      return res.status(400).json({ 
        error: 'Spotify playlist URL is required in the request body' 
      });
    }

    if (!outputPath) {
      return res.status(400).json({ 
        error: 'Output path is required in the request body' 
      });
    }

    // Additional validation using utility
    const validation = validateSpotifyUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Start the playlist download using the service
    // This may take some time, so we'll send an initial response and then process
    res.status(200).json({
      success: true,
      message: 'Playlist download started',
      playlistUrl: url
    });

    // Process the download in the background
    try {
      const result = await spotifyService.downloadPlaylist(url, outputPath);
      
      logger.info(`Playlist download completed: ${result.successfulDownloads} successful, ${result.failedDownloads} failed`);
    } catch (error) {
      logger.error(`Error in background playlist download: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    logger.error(`Error in downloadSpotifyPlaylist controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getSpotifyMetadata,
  getSpotifyPlaylist,
  downloadSpotifyTrack,
  downloadSpotifyPlaylist
};