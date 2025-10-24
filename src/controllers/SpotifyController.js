const SpotifyMetadata = require('../models/SpotifyMetadata');
const trackDownload = require('../models/track_download');
const path = require('path');
const fs = require('fs').promises;

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

  static async downloadPlaylist(req, res) {
    const { spotifyUrl } = req.body;

    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    try {
      // Extract playlist metadata
      const playlistData = await SpotifyMetadata.extractPlaylistMetadata(spotifyUrl);
      if (!playlistData || !playlistData.playlistName || !playlistData.tracks || playlistData.tracks.length === 0) {
        return res.status(500).json({ error: 'Failed to extract playlist data or playlist is empty' });
      }

      // Create a directory for the playlist
      const playlistDir = path.join(__dirname, '..', '..', 'downloads', playlistData.playlistName.replace(/[<>:"/\\|?*]/g, '_')); // Sanitize directory name
      await fs.mkdir(playlistDir, { recursive: true });

      // Save playlist info
      const playlistInfoPath = path.join(playlistDir, 'playlist_info.json');
      await fs.writeFile(playlistInfoPath, JSON.stringify({
        name: playlistData.playlistName,
        owner: playlistData.playlistOwner,
        trackCount: playlistData.trackCount,
        url: spotifyUrl,
        tracks: playlistData.tracks.map(track => ({
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration_ms: track.duration_ms
        }))
      }, null, 2));

      // Download each track in the playlist
      const downloadPromises = [];
      const results = [];
      
      for (let i = 0; i < playlistData.tracks.length; i++) {
        const track = playlistData.tracks[i];
        if (track.title && track.artist) {
          const trackPromise = SpotifyMetadata.fetchYoutubeUrl(track.title, track.artist)
            .then(async (youtubeUrl) => {
              if (youtubeUrl) {
                // Create a filename with track number, title and artist
                const trackNumber = String(i + 1).padStart(2, '0'); // Pad with leading zero
                const fileName = `${trackNumber} - ${track.title} - ${track.artist}.mp3`;
                const outputPath = path.join(playlistDir, fileName);
                
                await trackDownload.downloadTrack(youtubeUrl, outputPath);
                return { track: `${track.title} by ${track.artist}`, status: 'success', path: outputPath };
              } else {
                return { track: `${track.title} by ${track.artist}`, status: 'failed', error: 'Could not find YouTube URL' };
              }
            })
            .catch(error => {
              console.error(`Error downloading track ${track.title} by ${track.artist}: ${error.message}`);
              return { track: `${track.title} by ${track.artist}`, status: 'failed', error: error.message };
            });
          
          downloadPromises.push(trackPromise);
        }
      }

      // Wait for all downloads to complete
      const downloadResults = await Promise.all(downloadPromises);
      const successfulDownloads = downloadResults.filter(result => result.status === 'success');
      const failedDownloads = downloadResults.filter(result => result.status === 'failed');

      res.json({ 
        message: `Playlist download completed. ${successfulDownloads.length} tracks downloaded successfully, ${failedDownloads.length} tracks failed.`,
        playlistName: playlistData.playlistName,
        totalTracks: playlistData.trackCount,
        successfulDownloads: successfulDownloads.length,
        failedDownloads: failedDownloads.length,
        directory: playlistDir,
        details: downloadResults
      });
    } catch (error) {
      console.error(`Error downloading playlist: ${error.message}`);
      res.status(500).json({ error: 'Failed to download playlist', details: error.message });
    }
  }

}

module.exports = SpotifyController;