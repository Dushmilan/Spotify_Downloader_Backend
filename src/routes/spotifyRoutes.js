const express = require('express');
const router = express.Router();
const { getSpotifyMetadata, getSpotifyPlaylist } = require('../controllers/spotifyController');
const { downloadSpotifyTrack, downloadSpotifyPlaylist } = require('../controllers/spotifyController');

// Endpoint to extract metadata from a Spotify URL
router.get('/metadata', getSpotifyMetadata);

// Endpoint to get tracks from a Spotify playlist
router.get('/playlist', getSpotifyPlaylist);

// Endpoint to download a single track from Spotify URL
router.post('/download-track', downloadSpotifyTrack);

// Endpoint to download all tracks from a Spotify playlist
router.post('/download-playlist', downloadSpotifyPlaylist);

module.exports = router;