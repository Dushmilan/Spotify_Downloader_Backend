const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;

// Function to find Python executable
function findPython() {
    // Common Python installation paths on Windows
    const pythonPaths = [
        'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
        'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
        'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
        'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
        'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
        'python',
        'py'
    ];
    
    // For this specific implementation, using the detected path
    return 'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python314\\python.exe';
}

const PYTHON_PATH = findPython();

app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Endpoint to download Spotify track
app.post('/download-spotify', async (req, res) => {
    try {
        const { spotifyUrl } = req.body;
        
        if (!spotifyUrl) {
            return res.status(400).json({ error: 'Spotify URL is required' });
        }

        // First, extract metadata from Spotify
        console.log('Extracting metadata from Spotify URL...');
        const metadata = await extractSpotifyMetadata(spotifyUrl);
        
        if (!metadata) {
            return res.status(500).json({ error: 'Failed to extract Spotify metadata' });
        }

        // Then, search and download from YouTube using the metadata
        console.log('Searching and downloading from YouTube...');
        const downloadResult = await downloadFromYouTube(metadata);
        
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
});

// Helper function to extract Spotify metadata using Python
function extractSpotifyMetadata(spotifyUrl) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn(PYTHON_PATH, [
            path.join(__dirname, 'spotify', 'metadata_extractor.py'),
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

// Helper function to download from YouTube using Python and yt-dlp
function downloadFromYouTube(metadata) {
    return new Promise((resolve, reject) => {
        const { title, artist } = metadata;
        const downloadsDir = path.join(__dirname, 'downloads');
        
        // Ensure downloads directory exists
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const pythonProcess = spawn(PYTHON_PATH, [
            path.join(__dirname, 'yt-dlp', 'downloader.py'),
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
                        filePath: path.join(downloadsDir, audioFile)
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

// Endpoint to download YouTube video (for testing)
app.post('/download-youtube', (req, res) => {
    const { youtubeUrl } = req.body;
    
    if (!youtubeUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const pythonProcess = spawn(PYTHON_PATH, [
        path.join(__dirname, 'yt-dlp', 'downloader.py'),
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
});

// Serve the downloads directory
app.use('/downloads', express.static('downloads'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
