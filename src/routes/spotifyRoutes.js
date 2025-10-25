const express = require('express');
const router = express.Router();
const { getSpotifyMetadata, getSpotifyPlaylist } = require('../controllers/spotifyController');

// Endpoint to extract metadata from a Spotify URL
router.get('/metadata', getSpotifyMetadata);

// Endpoint to get tracks from a Spotify playlist
router.get('/playlist', getSpotifyPlaylist);

module.exports = router;