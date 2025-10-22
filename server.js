const express = require('express');
const cors = require('cors');
const path = require('path');
const SpotifyController = require('./controllers/SpotifyController');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory (the View layer)

// Initialize controller
const spotifyController = new SpotifyController();

// Routes (Controller layer)
app.post('/download-spotify', (req, res) => {
  spotifyController.downloadSpotify(req, res);
});

app.post('/download-youtube', (req, res) => {
  spotifyController.downloadYouTube(req, res);
});

// Serve the downloads directory
app.use('/downloads', express.static('downloads'));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;