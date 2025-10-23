const SpotifyMetadata = require('../models/SpotifyMetadata');
const trackDownload = require('../models/track_download');

class SpotifyController {
  static async getMetadata(req, res) {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
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

  static async getYoutubeUrl(req, res) {
    const{TrackName,ArtistName}=req.body;
    if(!TrackName || !ArtistName){
      return res.status(400).json({error:'TrackName and ArtistName are required'});
    }
    try{
      const youtubeUrl=await SpotifyMetadata.fetchYoutubeUrl(TrackName,ArtistName);
      res.json({youtubeUrl});
    }catch(error){
      console.error(`Error fetching YouTube URL: ${error.message}`);
      res.status(500).json({error:'Failed to fetch YouTube URL',details:error.message});
    }
}
  static async downloadTrack(req, res) {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    try {
      const metadata = await SpotifyMetadata.extractMetadata(spotifyUrl);
      if (!metadata || !metadata.TrackName || !metadata.ArtistName) {
        return res.status(500).json({ error: 'Failed to extract track and artist name from metadata' });
      }
      const youtubeUrl = await SpotifyMetadata.fetchYoutubeUrl(metadata.TrackName, metadata.ArtistName);
      
      const outputPath = `downloads/${metadata.TrackName} - ${metadata.ArtistName}.mp3`;
      await trackDownload.downloadTrack(youtubeUrl, outputPath);
      
      res.json({ message: 'Track downloaded successfully', path: outputPath });
    } catch (error) {
      console.error(`Error downloading track: ${error.message}`);
      res.status(500).json({ error: 'Failed to download track', details: error.message });
    }
  }

}

module.exports = SpotifyController;