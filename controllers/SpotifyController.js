const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const PythonService = require('../models/PythonService');

class SpotifyController {
  constructor() {
    this.PythonService = new PythonService();
  }

  // Endpoint to download Spotify track
  async downloadSpotify(req, res) {
    try {
      const { spotifyUrl } = req.body;
      
      if (!spotifyUrl) {
        return res.status(400).json({ error: 'Spotify URL is required' });
      }

      // First, extract metadata from Spotify
      console.log('Extracting metadata from Spotify URL...');
      const metadata = await this.PythonService.extractSpotifyMetadata(spotifyUrl);
      
      if (!metadata) {
        return res.status(500).json({ error: 'Failed to extract Spotify metadata' });
      }

      // Then, search and download from YouTube using the metadata
      console.log('Searching and downloading from YouTube...');
      const downloadResult = await this.PythonService.downloadFromYouTube(metadata);
      
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

  // Endpoint to download YouTube video (for testing)
  async downloadYouTube(req, res) {
    const { youtubeUrl } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const downloadsDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const pythonProcess = spawn(this.PythonService.getPythonPath(), [
      path.join(__dirname, '../yt-dlp', 'downloader.py'),
      youtubeUrl,
      downloadsDir
    ]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, message: 'Download completed' });
      } else {
        res.status(500).json({ error: `Download failed with code ${code}` });
      }
    });
  }
}

module.exports = SpotifyController;