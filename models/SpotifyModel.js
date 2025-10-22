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
            // Clean up the result string to extract only the JSON part
            const cleanedResult = result.trim();
            
            // Find the first JSON object in the output by looking for '{' and matching brackets
            const jsonStart = cleanedResult.indexOf('{');
            if (jsonStart === -1) {
              throw new Error('No JSON found in output');
            }
            
            // Extract just the JSON object
            let openBraces = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < cleanedResult.length; i++) {
              if (cleanedResult[i] === '{') {
                openBraces++;
              } else if (cleanedResult[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            
            if (jsonEnd === -1) {
              throw new Error('Invalid JSON structure');
            }
            
            const jsonString = cleanedResult.substring(jsonStart, jsonEnd + 1);
            const metadata = JSON.parse(jsonString);
            
            if (metadata.error) {
              reject(new Error(metadata.error));
            } else {
              resolve(metadata);
            }
          } catch (parseError) {
            console.error('Error parsing metadata JSON:', result);
            reject(new Error('Failed to parse metadata from Python script: ' + parseError.message));
          }
        } else {
          console.error('Python script error:', error);
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        }
      });
    });
  }

  // Get audio info based on Spotify metadata using Python and yt-dlp
  async getAudioInfoFromSpotifyMetadata(metadata) {
    return new Promise((resolve, reject) => {
      const { title, artist } = metadata;

      const pythonProcess = spawn(this.PYTHON_PATH, [
        path.join(__dirname, '../yt-dlp', 'downloader.py'),
        title,
        artist
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
            // Clean up the result string to extract only the JSON part
            const cleanedResult = result.trim();
            
            // Find the first JSON object in the output by looking for '{' and matching brackets
            const jsonStart = cleanedResult.indexOf('{');
            if (jsonStart === -1) {
              throw new Error('No JSON found in output');
            }
            
            // Extract just the JSON object
            let openBraces = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < cleanedResult.length; i++) {
              if (cleanedResult[i] === '{') {
                openBraces++;
              } else if (cleanedResult[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            
            if (jsonEnd === -1) {
              throw new Error('Invalid JSON structure');
            }
            
            const jsonString = cleanedResult.substring(jsonStart, jsonEnd + 1);
            const audioInfo = JSON.parse(jsonString);
            
            if (audioInfo.success) {
              resolve({
                success: true,
                title: audioInfo.title,
                audioUrl: audioInfo.url,  // This is the direct audio URL
                webpageUrl: audioInfo.webpage_url,
                duration: audioInfo.duration,
                uploader: audioInfo.uploader,
                formats: audioInfo.formats
              });
            } else {
              resolve({
                success: false,
                error: audioInfo.error || 'Could not find audio for the given track'
              });
            }
          } catch (parseError) {
            console.error('Error parsing audio info JSON:', result);
            resolve({
              success: false,
              error: 'Failed to parse audio info from Python script: ' + parseError.message
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

  // Get audio info directly from a Spotify URL if yt-dlp supports it
  async getAudioInfoFromSpotifyUrl(spotifyUrl) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.PYTHON_PATH, [
        path.join(__dirname, '../yt-dlp', 'downloader.py'),
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
            // Clean up the result string to extract only the JSON part
            const cleanedResult = result.trim();
            
            // Find the first JSON object in the output by looking for '{' and matching brackets
            const jsonStart = cleanedResult.indexOf('{');
            if (jsonStart === -1) {
              throw new Error('No JSON found in output');
            }
            
            // Extract just the JSON object
            let openBraces = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < cleanedResult.length; i++) {
              if (cleanedResult[i] === '{') {
                openBraces++;
              } else if (cleanedResult[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            
            if (jsonEnd === -1) {
              throw new Error('Invalid JSON structure');
            }
            
            const jsonString = cleanedResult.substring(jsonStart, jsonEnd + 1);
            const audioInfo = JSON.parse(jsonString);
            
            if (audioInfo.success) {
              resolve({
                success: true,
                title: audioInfo.title,
                audioUrl: audioInfo.url,  // This is the direct audio URL
                webpageUrl: audioInfo.webpage_url,
                duration: audioInfo.duration,
                uploader: audioInfo.uploader,
                formats: audioInfo.formats
              });
            } else {
              resolve({
                success: false,
                error: audioInfo.error || 'Could not extract audio info from the given URL'
              });
            }
          } catch (parseError) {
            console.error('Error parsing audio info JSON:', result);
            resolve({
              success: false,
              error: 'Failed to parse audio info from Python script: ' + parseError.message
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