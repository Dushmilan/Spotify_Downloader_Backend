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
      console.error(`Python script stderr: ${stderr}`);
      // If there are errors in stderr, try to parse them as JSON
      try {
        const errorResult = JSON.parse(stderr.trim());
        return res.status(500).json(errorResult);
      } catch (e) {
        return res.status(500).json({ error: 'Error occurred during metadata extraction', details: stderr });
      }
    }

    try {
      // Process stdout to extract JSON - may contain extra content
      const output = stdout.trim();
      
      // Look for JSON in the output (in case of extra logging messages)
      let jsonStart = output.indexOf('{');
      let jsonEnd = output.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
        const jsonString = output.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonString);
        res.json(result);
      } else {
        // If no JSON found in the expected format, try to parse the whole output
        const result = JSON.parse(output);
        res.json(result);
      }
    } catch (parseError) {
      console.error(`Error parsing Python output: ${stdout}`);
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