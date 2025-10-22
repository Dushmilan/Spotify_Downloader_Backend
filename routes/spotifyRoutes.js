// routes/spotifyRoutes.js
const express = require('express');
const SpotifyModel = require('../models/SpotifyModel');
const SpotifyController = require('../controllers/SpotifyController');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const spotifyModel = new SpotifyModel();
const spotifyController = new SpotifyController(spotifyModel);

// Routes
router.post('/download-spotify', (req, res) => {
  spotifyController.downloadSpotify(req, res);
});

// New download endpoint that takes a URL and returns the downloaded file
router.get('/download', async (req, res) => {
  try {
    const { url, title } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Sanitize the title for use as filename
    const sanitizedTitle = (title || 'audio').replace(/[<>:"/\\|?*]/g, '_');
    
    // Use Python script to download the audio
    const { spawn } = require('child_process');
    const pythonPath = spotifyModel.PYTHON_PATH;
    const outputDir = path.join(__dirname, '../downloads');
    
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `${sanitizedTitle.replace(/\s+/g, '_')}.%(ext)s`;
    const outputPath = path.join(outputDir, filename);
    
    const pythonProcess = spawn(pythonPath, [
      path.join(__dirname, '../yt-dlp', 'downloader.py'),
      'download',
      url,
      outputPath
    ]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Find the downloaded file (with actual extension)
          const files = fs.readdirSync(outputDir);
          const downloadedFile = files.find(file => 
            file.startsWith(sanitizedTitle.replace(/\s+/g, '_'))
          );
          
          if (downloadedFile) {
            const filePath = path.join(outputDir, downloadedFile);
            
            // Check if file exists and has content before sending
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              if (stats.size > 0) {
                res.download(filePath, downloadedFile, (err) => {
                  if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Error sending file' });
                  } else {
                    // Delete the file after sending it to client
                    setTimeout(() => {
                      try {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted temporary file: ${filePath}`);
                      } catch (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                      }
                    }, 1000); // Delete after 1 second to ensure it's been sent
                  }
                });
              } else {
                res.status(500).json({ error: 'Downloaded file is empty' });
              }
            } else {
              res.status(500).json({ error: 'Downloaded file not found' });
            }
          } else {
            res.status(500).json({ error: 'Downloaded file not found' });
          }
        } catch (fsError) {
          console.error('File system error:', fsError);
          res.status(500).json({ error: 'File system error' });
        }
      } else {
        // If server-side download fails due to restrictions, return an error with the original URL
        // so the frontend can handle the download differently
        console.log('Server-side download failed, providing fallback options');
        
        // Send a response that tells the frontend what happened and provides the original URL
        res.status(500).json({ 
          success: false, 
          error: 'Server-side download failed due to platform restrictions',
          streamUrl: url, // Provide the original URL for browser-based download/streaming
          message: 'Using browser download instead' 
        });
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;