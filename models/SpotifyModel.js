// models/SpotifyModel.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SpotifyModel {
  constructor() {
    this.PYTHON_PATH = this.findPython();
  }

  // Function to find Python executable
  findPython() {
    // Common Python installation paths on Windows
    const pythonPaths = [
      'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python314\\\\python.exe',
      'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python313\\\\python.exe',
      'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python312\\\\python.exe',
      'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python311\\\\python.exe',
      'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python310\\\\python.exe',
      'python',
      'py'
    ];
    
    // For this specific implementation, using the detected path
    return 'C:\\\\Users\\\\LENOVO\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python314\\\\python.exe';
  }

  // Extract Spotify metadata using Python
  async extractSpotifyMetadata(spotifyUrl) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.PYTHON_PATH, [
        path.join(__dirname, '../spotify', 'metadata_extractor.py'),
        spotifyUrl
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
            // Parse the JSON result from Python script
            const metadata = JSON.parse(result.trim());
            if (metadata.error) {
              reject(new Error(metadata.error));
            } else {
              resolve(metadata);
            }
          } catch (parseError) {
            console.error('Error parsing metadata JSON:', result);
            reject(new Error('Failed to parse metadata from Python script'));
          }
        } else {
          console.error('Python script error:', error);
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        }
      });
    });
  }

  // Download audio based on Spotify metadata using Python and yt-dlp
  async downloadFromSpotifyMetadata(metadata) {
    return new Promise((resolve, reject) => {
      const { title, artist } = metadata;
      const downloadsDir = path.join(__dirname, '../downloads');
      
      // Ensure downloads directory exists
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const pythonProcess = spawn(this.PYTHON_PATH, [
        path.join(__dirname, '../yt-dlp', 'downloader.py'),
        title,
        artist,
        downloadsDir
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
          // Find the downloaded file
          const files = fs.readdirSync(downloadsDir);
          const audioFile = files.find(file => file.endsWith('.mp3'));
          
          if (audioFile) {
            resolve({
              success: true,
              filePath: path.join('/downloads', audioFile)
            });
          } else {
            resolve({
              success: false,
              error: 'Audio file not found after download'
            });
          }
        } else {
          resolve({
            success: false,
            error: `Python script failed with code ${code}: ${error}`
          });
        }
      });
    });
  }

  // Download directly from a Spotify URL if yt-dlp supports it
  async downloadFromSpotifyUrl(spotifyUrl) {
    return new Promise((resolve, reject) => {
      const downloadsDir = path.join(__dirname, '../downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const pythonProcess = spawn(this.PYTHON_PATH, [
        path.join(__dirname, '../yt-dlp', 'downloader.py'),
        spotifyUrl,
        downloadsDir
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
          // Find the downloaded file
          const files = fs.readdirSync(downloadsDir);
          const audioFile = files.find(file => file.endsWith('.mp3'));
          
          if (audioFile) {
            resolve({
              success: true,
              filePath: path.join('/downloads', audioFile)
            });
          } else {
            resolve({
              success: false,
              error: 'Audio file not found after download'
            });
          }
        } else {
          resolve({
            success: false,
            error: `Python script failed with code ${code}: ${error}`
          });
        }
      });
    });
  }
}

module.exports = SpotifyModel;