const { exec } = require('child_process');
const path = require('path');
const config = require('../utils/config');

class SpotifyMetadata {
  static extractMetadata(spotifyUrl) {
    return new Promise((resolve, reject) => {
      // Execute the Python script to extract metadata
      const pythonScript = path.join(__dirname, '..', '..', 'spotify', 'spotify_metadata.py');
      
      const child = exec(`${config.pythonPath} "${pythonScript}" "${spotifyUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Python script: ${error.message}`);
          reject(new Error('Failed to extract metadata'));
          return;
        }

        if (stderr) {
          console.error(`Python script stderr: ${stderr}`);
          // If there are errors in stderr, try to parse them as JSON
          try {
            const errorResult = JSON.parse(stderr.trim());
            reject(new Error(errorResult.error || 'Error occurred during metadata extraction'));
            return;
          } catch (e) {
            reject(new Error('Error occurred during metadata extraction'));
            return;
          }
        }

        try {
          // Process stdout to extract JSON - may contain extra content
          const output = stdout.trim();
          
          // Look for JSON in the output (in case of extra logging messages)
          let jsonStart = output.indexOf('{');
          let jsonEnd = output.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
            const jsonString = output.substring(jsonStart, jsonEnd + 1);
            const result = JSON.parse(jsonString);
            resolve(result);
          } else {
            // If no JSON found in the expected format, try to parse the whole output
            const result = JSON.parse(output);
            resolve(result);
          }
        } catch (parseError) {
          console.error(`Error parsing Python output: ${stdout}`);
          reject(new Error('Failed to parse metadata'));
        }
      });
    });
  }

  static isValidSpotifyUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('spotify.com') || 
             parsedUrl.hostname.includes('open.spotify.com');
    } catch (error) {
      return false;
    }
  }

  static fetchYoutubeUrl(TrackName, ArtistName) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '..', '..', 'spotify', 'fetch_youtube_url.py');
      
      const child = exec(`${config.pythonPath} "${pythonScript}" "${TrackName}" "${ArtistName}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Python script: ${error.message}`);
          reject(new Error('Failed to fetch YouTube URL'));
          return;
        }

        if (stderr) {
          console.error(`Python script stderr: ${stderr}`);
          // If there are errors in stderr, try to parse them as JSON
          try {
            const errorResult = JSON.parse(stderr.trim());
            reject(new Error(errorResult.error || 'Error occurred during YouTube URL fetching'));
            return;
          } catch (e) {
            reject(new Error('Error occurred during YouTube URL fetching'));
            return;
          }
        }

        try {
          const output = stdout.trim();
          const result = JSON.parse(output);
          resolve(result.youtube_url);
        } catch (parseError) {
          console.error(`Error parsing Python output: ${stdout}`);
          reject(new Error('Failed to parse YouTube URL'));
        }
      });
    });
  }
}

module.exports = SpotifyMetadata;