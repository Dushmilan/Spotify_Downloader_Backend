// routes/spotifyRoutes.js
const express = require('express');
const SpotifyModel = require('../models/SpotifyModel');
const SpotifyController = require('../controllers/SpotifyController');

const router = express.Router();
const spotifyModel = new SpotifyModel();
const spotifyController = new SpotifyController(spotifyModel);

// Routes
router.post('/download-spotify', (req, res) => {
  spotifyController.downloadSpotify(req, res);
});

module.exports = router;