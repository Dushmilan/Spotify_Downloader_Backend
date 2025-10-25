const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Service endpoints
const METADATA_SERVICE_URL = process.env.METADATA_SERVICE_URL || 'http://localhost:3001';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3002';
const DOWNLOAD_SERVICE_URL = process.env.DOWNLOAD_SERVICE_URL || 'http://localhost:3003';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Spotify Downloader API Gateway is running', 
    services: {
      metadata: METADATA_SERVICE_URL,
      search: SEARCH_SERVICE_URL,
      download: DOWNLOAD_SERVICE_URL
    }
  });
});

// Route for getting Spotify metadata
app.post('/get-metadata', async (req, res) => {
  try {
    const response = await axios.post(`${METADATA_SERVICE_URL}/metadata`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
});

// Route for getting YouTube URL
app.post('/get-youtube_url', async (req, res) => {
  try {
    const response = await axios.post(`${SEARCH_SERVICE_URL}/youtube-url`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching YouTube URL:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube URL', details: error.message });
  }
});

// Route for downloading a single track
app.post('/download-track', async (req, res) => {
  try {
    const response = await axios.post(`${DOWNLOAD_SERVICE_URL}/download-track`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error downloading track:', error.message);
    res.status(500).json({ error: 'Failed to download track', details: error.message });
  }
});

// Route for downloading a playlist
app.post('/download-playlist', async (req, res) => {
  try {
    const response = await axios.post(`${DOWNLOAD_SERVICE_URL}/download-playlist`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error downloading playlist:', error.message);
    res.status(500).json({ error: 'Failed to download playlist', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;