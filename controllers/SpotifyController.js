// controllers/SpotifyController.js
class SpotifyController {
  constructor(model) {
    this.model = model;
  }

  async downloadSpotify(req, res) {
    try {
      const { spotifyUrl } = req.body;
      
      if (!spotifyUrl) {
        return res.status(400).json({ error: 'Spotify URL is required' });
      }

      // First, extract metadata from Spotify
      console.log('Extracting metadata from Spotify URL...');
      const metadata = await this.model.extractSpotifyMetadata(spotifyUrl);
      
      if (!metadata) {
        return res.status(500).json({ error: 'Failed to extract Spotify metadata' });
      }

      // Then, search and download from YouTube using the metadata
      console.log('Searching and downloading from YouTube...');
      const downloadResult = await this.model.downloadFromYouTube(metadata);
      
      if (downloadResult.success) {
        res.json({ 
          success: true, 
          metadata: metadata,
          downloadPath: downloadResult.filePath,
          message: 'Track downloaded successfully'
        });
      } else {
        res.status(500).json({ error: downloadResult.error || 'Failed to download track' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async downloadYouTube(req, res) {
    const { youtubeUrl } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const result = await this.model.downloadFromYouTubeUrl(youtubeUrl);
    
    if (result.success) {
      res.json({ success: true, message: result.message || 'Download completed' });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
}

module.exports = SpotifyController;