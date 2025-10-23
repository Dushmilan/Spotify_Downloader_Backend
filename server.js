const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());

// Endpoint to get Spotify track metadata
app.post('/get-metadata', (req, res) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  // Validate Spotify URL format
  if (!isValidSpotifyUrl(spotifyUrl)) {
    return res.status(400).json({ error: 'Invalid Spotify URL format' });
  }

  // Execute the Python script to extract metadata
  const pythonScript = path.join(__dirname, 'spotify', 'spotify_metadata.py');
  const child = exec(`python "${pythonScript}" "${spotifyUrl}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).json({ error: 'Failed to extract metadata', details: error.message });
    }

    if (stderr) {
      // If there are errors in stderr, try to parse them as JSON
      try {
        const errorResult = JSON.parse(stderr);
        return res.status(500).json(errorResult);
      } catch (e) {
        console.error(`Python script stderr: ${stderr}`);
        return res.status(500).json({ error: 'Error occurred during metadata extraction', details: stderr });
      }
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse metadata', details: parseError.message });
    }
  });
});

// Validate Spotify URL
function isValidSpotifyUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('spotify.com') || 
           parsedUrl.hostname.includes('open.spotify.com');
  } catch (error) {
    return false;
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Spotify Metadata API Server is running', endpoints: ['/get-metadata'] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Spotify Metadata Server running on port ${PORT}`);
});