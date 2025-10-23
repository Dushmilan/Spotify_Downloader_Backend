const SpotifyMetadata = require('../models/SpotifyMetadata');

class SpotifyController {
  static async getMetadata(req, res) {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    // Validate Spotify URL format
    if (!SpotifyMetadata.isValidSpotifyUrl(spotifyUrl)) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }

    try {
      const result = await SpotifyMetadata.extractMetadata(spotifyUrl);
      res.json(result);
    } catch (error) {
      console.error(`Error extracting metadata: ${error.message}`);
      res.status(500).json({ error: 'Failed to extract metadata', details: error.message });
    }
  }

  static healthCheck(req, res) {
    res.json({ message: 'Spotify Metadata API Server is running', endpoints: ['/get-metadata'] });
  }
}

module.exports = SpotifyController;