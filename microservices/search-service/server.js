const express = require('express');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Configuration
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Endpoint to fetch YouTube URL
app.post('/youtube-url', (req, res) => {
  const { TrackName, ArtistName } = req.body;

  if (!TrackName || !ArtistName) {
    return res.status(400).json({ error: 'TrackName and ArtistName are required' });
  }

  // Execute Python script to search for YouTube URL
  const pythonScript = path.join(__dirname, '..', '..', 'spotify', 'fetch_youtube_url.py');
  
  const child = exec(`${PYTHON_PATH} "${pythonScript}" "${TrackName}" "${ArtistName}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).json({ error: 'Failed to fetch YouTube URL' });
    }

    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
      try {
        const errorResult = JSON.parse(stderr.trim());
        return res.status(500).json({ error: errorResult.error || 'Error occurred during YouTube URL fetching' });
      } catch (e) {
        return res.status(500).json({ error: 'Error occurred during YouTube URL fetching' });
      }
    }

    try {
      const output = stdout.trim();
      const result = JSON.parse(output);
      res.json({ youtubeUrl: result.youtube_url });
    } catch (parseError) {
      console.error(`Error parsing Python output: ${stdout}`);
      res.status(500).json({ error: 'Failed to parse YouTube URL' });
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Search Service is running', endpoint: '/youtube-url' });
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
  console.log(`Search Service running on port ${PORT}`);
});

module.exports = app;