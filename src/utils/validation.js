// Validation utilities for the application
const { executePythonScript } = require('./pythonExecutor');

// Validate Spotify URL format
const validateSpotifyUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('spotify.com') && !parsedUrl.hostname.includes('open.spotify.com')) {
      return { isValid: false, error: 'URL must be a valid Spotify URL' };
    }

    // Check if it's a track, playlist, or album URL
    const validPaths = ['/track/', '/playlist/', '/album/', '/episode/', '/show/'];
    const isValidPath = validPaths.some(path => parsedUrl.pathname.includes(path));
    
    if (!isValidPath) {
      return { isValid: false, error: 'URL must point to a track, playlist, album, episode, or show' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Validate YouTube URL format
const validateYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  try {
    const parsedUrl = new URL(url);
    const isYouTube = parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');
    
    if (!isYouTube) {
      return { isValid: false, error: 'URL must be a valid YouTube URL' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Validate a search query
const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { isValid: false, error: 'Search query must be a non-empty string' };
  }

  if (query.trim().length > 200) {
    return { isValid: false, error: 'Search query is too long (max 200 characters)' };
  }

  return { isValid: true };
};

// Validate file path
const validatePath = (path) => {
  if (!path || typeof path !== 'string' || path.trim().length === 0) {
    return { isValid: false, error: 'Path must be a non-empty string' };
  }

  // Basic validation to prevent path traversal
  if (path.includes('../') || path.includes('..\\')) {
    return { isValid: false, error: 'Path traversal is not allowed' };
  }

  return { isValid: true };
};

module.exports = {
  validateSpotifyUrl,
  validateYouTubeUrl,
  validateSearchQuery,
  validatePath
};