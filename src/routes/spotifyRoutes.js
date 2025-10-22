const express = require('express');
const SpotifyController = require('../controllers/spotifyController');
const YouTubeController = require('../controllers/youtubeController');
const validation = require('../middleware/validation');

const router = express.Router();

// Spotify routes
router.post('/download-spotify', validation.validateSpotifyBody, SpotifyController.downloadSpotify);
router.post('/validate-spotify', validation.validateSpotifyBody, SpotifyController.validateSpotifyUrl);

// YouTube routes
router.post('/download-youtube', validation.validateYouTubeBody, YouTubeController.downloadYouTube);
router.post('/validate-youtube', validation.validateYouTubeBody, YouTubeController.validateYouTubeUrl);

module.exports = router;