const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());

// Configuration
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Endpoint to download a single track
app.post('/download-track', async (req, res) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  try {
    // First, we need to get metadata and YouTube URL by calling external services
    // For this implementation, we'll need to execute the Python scripts directly
    // as the services are separate
    
    // Execute Python script to extract metadata
    const metadataScript = path.join(__dirname, '..', '..', 'spotify', 'spotify_metadata.py');
    const metadataResult = await new Promise((resolve, reject) => {
      exec(`${PYTHON_PATH} "${metadataScript}" "${spotifyUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing metadata script: ${error.message}`);
          reject(new Error(`Failed to extract metadata: ${error.message}`));
          return;
        }

        if (stderr) {
          console.error(`Metadata script stderr: ${stderr}`);
          reject(new Error(`Metadata script error: ${stderr}`));
          return;
        }

        try {
          const output = stdout.trim();
          let jsonStart = output.indexOf('{');
          let jsonEnd = output.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
            const jsonString = output.substring(jsonStart, jsonEnd + 1);
            const result = JSON.parse(jsonString);
            resolve(result);
          } else {
            const result = JSON.parse(output);
            resolve(result);
          }
        } catch (parseError) {
          console.error(`Error parsing metadata output: ${stdout}`);
          reject(new Error(`Failed to parse metadata: ${parseError.message}`));
        }
      });
    });

    if (!metadataResult.metadata.title || !metadataResult.metadata.artist) {
      return res.status(500).json({ error: 'Failed to extract track and artist name from metadata' });
    }

    // Execute Python script to fetch YouTube URL
    const searchScript = path.join(__dirname, '..', '..', 'spotify', 'fetch_youtube_url.py');
    const youtubeResult = await new Promise((resolve, reject) => {
      exec(`${PYTHON_PATH} "${searchScript}" "${metadataResult.metadata.title}" "${metadataResult.metadata.artist}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing YouTube search script: ${error.message}`);
          reject(new Error(`Failed to fetch YouTube URL: ${error.message}`));
          return;
        }

        if (stderr) {
          console.error(`YouTube search script stderr: ${stderr}`);
          reject(new Error(`YouTube search script error: ${stderr}`));
          return;
        }

        try {
          const output = stdout.trim();
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          console.error(`Error parsing YouTube URL output: ${stdout}`);
          reject(new Error(`Failed to parse YouTube URL: ${parseError.message}`));
        }
      });
    });

    if (!youtubeResult.youtube_url) {
      return res.status(500).json({ error: 'Could not find YouTube URL for the track' });
    }

    // Execute Python script to download the track
    const downloadScript = path.join(__dirname, '..', '..', 'youtube', 'youtube_downloader.py');
    const outputPath = `downloads/${metadataResult.metadata.title} - ${metadataResult.metadata.artist}.mp3`;
    
    await new Promise((resolve, reject) => {
      exec(`${PYTHON_PATH} "${downloadScript}" "${youtubeResult.youtube_url}" "${outputPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing download script: ${error.message}`);
          reject(new Error(`Failed to download track: ${error.message}`));
          return;
        }

        if (stderr) {
          console.error(`Download script stderr: ${stderr}`);
          reject(new Error(`Download script error: ${stderr}`));
          return;
        }

        console.log(`Download script output: ${stdout}`);
        resolve(stdout.trim());
      });
    });

    res.json({ message: 'Track downloaded successfully', path: outputPath });
  } catch (error) {
    console.error(`Error downloading track: ${error.message}`);
    res.status(500).json({ error: 'Failed to download track', details: error.message });
  }
});

// Endpoint to download a playlist
app.post('/download-playlist', async (req, res) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  try {
    // Execute Python script to extract playlist metadata
    const playlistScript = path.join(__dirname, '..', '..', 'spotify', 'spotify_playlist.py');
    const playlistResult = await new Promise((resolve, reject) => {
      exec(`${PYTHON_PATH} "${playlistScript}" "${spotifyUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing playlist script: ${error.message}`);
          reject(new Error(`Failed to extract playlist metadata: ${error.message}`));
          return;
        }

        if (stderr) {
          console.error(`Playlist script stderr: ${stderr}`);
          reject(new Error(`Playlist script error: ${stderr}`));
          return;
        }

        try {
          const output = stdout.trim();
          let jsonStart = output.indexOf('{');
          let jsonEnd = output.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
            const jsonString = output.substring(jsonStart, jsonEnd + 1);
            const result = JSON.parse(jsonString);
            if (!result.success) {
              reject(new Error(result.error || 'Playlist metadata extraction failed'));
              return;
            }
            resolve(result);
          } else {
            const result = JSON.parse(output);
            if (!result.success) {
              reject(new Error(result.error || 'Playlist metadata extraction failed'));
              return;
            }
            resolve(result);
          }
        } catch (parseError) {
          console.error(`Error parsing playlist output: ${stdout}`);
          reject(new Error(`Failed to parse playlist metadata: ${parseError.message}`));
        }
      });
    });

    if (!playlistResult.success || !playlistResult.playlist || !playlistResult.playlist.name || 
        !playlistResult.playlist.tracks || playlistResult.playlist.tracks.length === 0) {
      return res.status(500).json({ error: 'Failed to extract playlist data or playlist is empty' });
    }

    // Create a directory for the playlist
    const playlistDir = path.join(__dirname, '..', '..', 'downloads', playlistResult.playlist.name.replace(/[<>:"/\\|?*]/g, '_')); // Sanitize directory name
    await fs.mkdir(playlistDir, { recursive: true });

    // Save playlist info
    const playlistInfoPath = path.join(playlistDir, 'playlist_info.json');
    await fs.writeFile(playlistInfoPath, JSON.stringify({
      name: playlistResult.playlist.name,
      owner: playlistResult.playlist.owner,
      trackCount: playlistResult.playlist.track_count,
      url: spotifyUrl,
      tracks: playlistResult.playlist.tracks.map(track => ({
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration_ms: track.duration_ms
      }))
    }, null, 2));

    // Download each track in the playlist
    const downloadPromises = [];
    const results = [];
    
    for (let i = 0; i < playlistResult.playlist.tracks.length; i++) {
      const track = playlistResult.playlist.tracks[i];
      if (track.title && track.artist) {
        const trackPromise = new Promise((resolve, reject) => {
          // Execute Python script to fetch YouTube URL for the track
          const searchScript = path.join(__dirname, '..', '..', 'spotify', 'fetch_youtube_url.py');
          exec(`${PYTHON_PATH} "${searchScript}" "${track.title}" "${track.artist}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing YouTube search script for ${track.title}: ${error.message}`);
              resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: error.message });
              return;
            }

            if (stderr) {
              console.error(`YouTube search script stderr for ${track.title}: ${stderr}`);
              resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: stderr });
              return;
            }

            try {
              const output = stdout.trim();
              const result = JSON.parse(output);
              
              if (result.youtube_url) {
                // Create a filename with track number, title and artist
                const trackNumber = String(i + 1).padStart(2, '0'); // Pad with leading zero
                const fileName = `${trackNumber} - ${track.title} - ${track.artist}.mp3`;
                const outputPath = path.join(playlistDir, fileName);
                
                // Execute Python script to download the track
                const downloadScript = path.join(__dirname, '..', '..', 'youtube', 'youtube_downloader.py');
                exec(`${PYTHON_PATH} "${downloadScript}" "${result.youtube_url}" "${outputPath}"`, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`Error downloading track ${track.title}: ${error.message}`);
                    resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: error.message });
                    return;
                  }

                  if (stderr) {
                    console.error(`Download script stderr for ${track.title}: ${stderr}`);
                    resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: stderr });
                    return;
                  }

                  console.log(`Download script output for ${track.title}: ${stdout}`);
                  resolve({ track: `${track.title} by ${track.artist}`, status: 'success', path: outputPath });
                });
              } else {
                resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: 'Could not find YouTube URL' });
              }
            } catch (parseError) {
              console.error(`Error parsing YouTube URL output for ${track.title}: ${stdout}`);
              resolve({ track: `${track.title} by ${track.artist}`, status: 'failed', error: parseError.message });
            }
          });
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
      playlistName: playlistResult.playlist.name,
      totalTracks: playlistResult.playlist.track_count,
      successfulDownloads: successfulDownloads.length,
      failedDownloads: failedDownloads.length,
      directory: playlistDir,
      details: downloadResults
    });
  } catch (error) {
    console.error(`Error downloading playlist: ${error.message}`);
    res.status(500).json({ error: 'Failed to download playlist', details: error.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Download Service is running', endpoints: ['/download-track', '/download-playlist'] });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Download Service running on port ${PORT}`);
});

module.exports = app;