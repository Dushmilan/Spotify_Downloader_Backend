const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const config = require('./src/config');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Configuration
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const SPOTIFY_SCRAPER_TIMEOUT = parseInt(process.env.SPOTIFY_SCRAPER_TIMEOUT) || 30000;

// Endpoint to extract Spotify metadata
app.post('/metadata', (req, res) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  // Validate Spotify URL format
  try {
    const url = new URL(spotifyUrl);
    if (!url.hostname.includes('spotify.com') && !url.hostname.includes('open.spotify.com')) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Execute Python script to extract metadata
  const pythonScript = path.join(__dirname, '..', '..', 'spotify', 'spotify_metadata.py');
  
  const child = exec(`${PYTHON_PATH} "${pythonScript}" "${spotifyUrl}"`, { timeout: SPOTIFY_SCRAPER_TIMEOUT }, (error, stdout, stderr) => {
    console.log('Python script stdout:', stdout);
    console.log('Python script stderr:', stderr);

    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).json({ error: 'Failed to extract metadata', details: error.message });
    }

    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
      try {
        const errorResult = JSON.parse(stderr.trim());
        return res.status(500).json({ error: errorResult.error || `Metadata script error: ${stderr}` });
      } catch (e) {
        return res.status(500).json({ error: `Non-JSON metadata script error: ${stderr}` });
      }
    }

    try {
      const output = stdout.trim();
      let jsonStart = output.indexOf('{');
      let jsonEnd = output.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
        const jsonString = output.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonString);

        if (!result.metadata.title || !result.metadata.artist) {
          return res.status(500).json({ error: 'Extracted metadata missing title or artist' });
        }

        res.json({
          TrackName: result.metadata.title,
          ArtistName: result.metadata.artist,
        });
      } else {
        try {
          const result = JSON.parse(output);
          if (!result.metadata.title || !result.metadata.artist) {
            return res.status(500).json({ error: 'Extracted metadata missing title or artist' });
          }
          res.json({
            TrackName: result.metadata.title,
            ArtistName: result.metadata.artist,
          });
        } catch (e) {
          return res.status(500).json({ error: `Could not find valid JSON in metadata script output: ${output}` });
        }
      }
    } catch (parseError) {
      console.error(`Error parsing Python output: ${stdout}`);
      res.status(500).json({ error: `Failed to parse metadata: ${parseError.message}` });
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Metadata Service is running', endpoint: '/metadata' });
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
  console.log(`Metadata Service running on port ${PORT}`);
});

module.exports = app;