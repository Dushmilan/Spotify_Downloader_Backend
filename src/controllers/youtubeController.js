const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');
const { validateSearchQuery, validateYouTubeUrl, validatePath } = require('../utils/validation');

// Controller for fetching YouTube URL
const getYouTubeUrl = async (req, res) => {
  try {
    const { query } = req.query;

    // Validate query parameter
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required as a query parameter' 
      });
    }

    // Additional validation using utility
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Fetch YouTube URL using the service
    const result = await youtubeService.fetchYouTubeUrl(query);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in getYouTubeUrl controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Controller for searching YouTube videos
const searchYouTubeVideos = async (req, res) => {
  try {
    const { q } = req.query;

    // Validate query parameter
    if (!q) {
      return res.status(400).json({ 
        error: 'Search query is required as a query parameter (use ?q=your_query)' 
      });
    }

    // Additional validation using utility
    const validation = validateSearchQuery(q);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.error 
      });
    }

    // Search for videos using the service
    const results = await youtubeService.searchVideos(q);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in searchYouTubeVideos controller: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Controller for downloading audio from YouTube
const downloadAudio = async (req, res) => {
  try {
    const { youtubeUrl, outputPath } = req.body;

    // Validate request body
    if (!youtubeUrl || !outputPath) {
      return res.status(400).json({ 
        error: 'Both youtubeUrl and outputPath are required in the request body' 
      });
    }

    // Additional validation using utilities
    const urlValidation = validateYouTubeUrl(youtubeUrl);
    if (!urlValidation.isValid) {
      return res.status(400).json({ 
        error: urlValidation.error 
      });
    }

    const pathValidation = validatePath(outputPath);
    if (!pathValidation.isValid) {
      return res.status(400).json({ 
        error: pathValidation.error 
      });
    }

    // Download audio using the service
    const result = await youtubeService.downloadAudio(youtubeUrl, outputPath);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Download completed successfully'
    });
  } catch (error) {
    logger.error(`Error in downloadAudio controller: ${error.message}`, {
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
  getYouTubeUrl,
  searchYouTubeVideos,
  downloadAudio
};