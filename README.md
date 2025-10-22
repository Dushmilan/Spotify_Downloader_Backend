# Spotify Track Downloader

A web application that extracts Spotify track metadata and downloads the audio from YouTube.

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (already installed based on your package.json)
2. **Python 3.6+** 
   - Download from [python.org](https://www.python.org/downloads/)
   - During installation, make sure to check "Add Python to PATH"
3. **FFmpeg** (for audio conversion)
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Add to system PATH

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Spotify_Downloader_Backend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python packages:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

2. Access the web interface at `http://localhost:3000`

## API Endpoints

- `POST /download-spotify` - Download a Spotify track by providing the Spotify URL
- `POST /validate-spotify` - Validate a Spotify URL
- `POST /download-youtube` - Directly download a YouTube video/audio
- `POST /validate-youtube` - Validate a YouTube URL

## How it Works

1. User provides a Spotify track URL through the web interface
2. The application extracts track metadata (title, artist, etc.) from Spotify
3. Using the metadata, it searches for the track on YouTube using an improved matching algorithm
4. Downloads the audio from the best matching YouTube video using multiple fallback strategies
5. Converts to MP3 format
6. Makes the file available for download

## Key Improvements

This implementation includes several key improvements for robustness:

1. **Enhanced YouTube Search**: Improved algorithm to find better matches between Spotify metadata and YouTube content, using similarity scoring and prioritizing official channels.

2. **Better Error Handling**: Added comprehensive error handling on both Node.js and Python sides, including Python availability checks before attempting operations.

3. **Improved Download Logic**: Multiple configuration fallbacks for yt-dlp to handle various YouTube restrictions and changes.

4. **File Management**: Proper file naming and handling to ensure downloads complete successfully.

## Configuration

The application can be configured using environment variables in a `.env` file:

```env
PORT=3000
PYTHON_PATH=python
DOWNLOADS_DIR=./downloads
LOG_LEVEL=info
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
```

## File Structure

```
Spotify_Downloader_Backend/
├── src/                    # Source code
│   ├── app.js              # Express app setup
│   ├── config/             # Configuration files
│   ├── controllers/        # Request controllers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   └── utils/              # Utility functions
├── spotify/                # Spotify-related Python scripts
│   ├── metadata_extractor.py
│   └── spotify_client.py
├── yt-dlp/                 # YouTube download Python script
│   └── downloader.py
├── public/                 # Static files
│   └── index.html          # Web interface
├── downloads/              # Downloaded files
├── logs/                   # Log files
├── server-mvc.js           # Server entry point
├── package.json            # Node.js dependencies
└── .env                    # Environment variables
```

## Troubleshooting

If you get a "Python was not found" error:
- Make sure Python is installed and added to your system PATH
- Restart your command prompt/terminal after installing Python

If you get a "ffmpeg not found" error:
- Install FFmpeg and add it to your system PATH