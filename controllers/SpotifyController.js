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

      // First, try to download directly from Spotify URL
      console.log('Attempting direct download from Spotify URL...');
      const directDownloadResult = await this.model.downloadFromSpotifyUrl(spotifyUrl);
      
      if (directDownloadResult.success) {
        res.json({ 
          success: true, 
          downloadPath: directDownloadResult.filePath,
          message: 'Track downloaded successfully from Spotify URL'
        });
        return;
      }
      
      // If direct download fails, extract metadata and search for the track on alternative platforms
      console.log('Direct download failed, extracting metadata from Spotify URL...');
      const metadata = await this.model.extractSpotifyMetadata(spotifyUrl);
      
      if (!metadata) {
        return res.status(500).json({ error: 'Failed to extract Spotify metadata' });
      }

      // Then, search and download from alternative platforms using the metadata
      console.log('Searching and downloading from alternative platforms...');
      const downloadResult = await this.model.downloadFromSpotifyMetadata(metadata);
      
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
}


module.exports = SpotifyController;