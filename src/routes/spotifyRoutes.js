const express = require('express');
const router = express.Router();
const SpotifyController = require('../controllers/SpotifyController');
const { validateSpotifyUrl } = require('../middleware/validation');

// Endpoint to get Spotify track metadata
router.post('/get-metadata', validateSpotifyUrl, SpotifyController.getMetadata);
router.post('/get-youtube_url',SpotifyController.getYoutubeUrl);
router.post('/download-track',SpotifyController.downloadTrack);


// Health check endpoint
router.get('/', SpotifyController.healthCheck);

module.exports = router;