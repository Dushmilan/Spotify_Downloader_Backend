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

      // First, try to get audio info directly from Spotify URL
      console.log('Attempting to get audio info directly from Spotify URL...');
      const directAudioInfoResult = await this.model.getAudioInfoFromSpotifyUrl(spotifyUrl);
      
      if (directAudioInfoResult.success) {
        

        
        res.json({ 
          success: true, 
          audioUrl: directAudioInfoResult.audioUrl,
          title: directAudioInfoResult.title,
          webpageUrl: directAudioInfoResult.webpageUrl,
          duration: directAudioInfoResult.duration,
          uploader: directAudioInfoResult.uploader,
          streamUrl: directAudioInfoResult.audioUrl, // Also provide direct stream URL as fallback
          downloadStatus: 'metadata_only', // Indicate download functionality has been removed
          message: 'Audio info retrieved successfully from Spotify URL (download functionality removed)'
        });
        
        return;
      }
      
      // If direct extraction fails, extract metadata and search for the track on alternative platforms
      console.log('Direct audio info extraction failed, extracting metadata from Spotify URL...');
      const metadata = await this.model.extractSpotifyMetadata(spotifyUrl);
      
      if (!metadata) {
        return res.status(500).json({ error: 'Failed to extract Spotify metadata' });
      }

      // Then, search for audio on alternative platforms using the metadata
      console.log('Searching for audio on alternative platforms...');
      const audioInfoResult = await this.model.getAudioInfoFromSpotifyMetadata(metadata);
      
      if (audioInfoResult.success) {
        

        
        res.json({ 
          success: true, 
          metadata: metadata,
          audioUrl: audioInfoResult.audioUrl,
          title: audioInfoResult.title,
          webpageUrl: audioInfoResult.webpageUrl,
          duration: audioInfoResult.duration,
          uploader: audioInfoResult.uploader,
          streamUrl: audioInfoResult.audioUrl, // Also provide direct stream URL as fallback
          downloadStatus: 'metadata_only', // Indicate download functionality has been removed
          message: 'Audio info retrieved successfully (download functionality removed)'
        });
      } else {
        res.status(500).json({ error: audioInfoResult.error || 'Failed to find audio track' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: error.message });
    }
  }
}


module.exports = SpotifyController;