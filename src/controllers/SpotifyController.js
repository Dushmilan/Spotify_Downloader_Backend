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

module.exports = {
  getSpotifyMetadata,
  getSpotifyPlaylist
};