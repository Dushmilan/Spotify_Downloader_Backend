const express = require('express');
const router = express.Router();
const { getYouTubeUrl, searchYouTubeVideos, downloadAudio } = require('../controllers/youtubeController');

// Endpoint to fetch YouTube URL for a given query
router.get('/url', getYouTubeUrl);

// Endpoint to search for YouTube videos
router.get('/search', searchYouTubeVideos);

// Endpoint to download audio from YouTube
router.post('/download', downloadAudio);

module.exports = router;