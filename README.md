# Spotify Downloader Backend

A comprehensive API that extracts Spotify track metadata and downloads tracks from YouTube using a combination of Node.js and Python. The project leverages the `spotify-scraper` library for metadata extraction and `yt-dlp` for YouTube downloads, built with a clean Model-View-Controller (MVC) architecture.

## Features

- **Spotify Metadata Extraction**: Extract detailed information from Spotify URLs including title, artist, album, duration, release date, track ID, preview URL, and more.
- **YouTube URL Fetching**: Search and retrieve the best matching YouTube URL for a given track and artist.
- **Track Downloading**: Download audio from YouTube as MP3 files with SponsorBlock integration to skip unwanted segments.
- **Playlist Downloading**: Download entire Spotify playlists with track numbering and organization, including playlist metadata in a JSON file.
- **SponsorBlock Integration**: Automatically skips sponsor segments, intros, and outros using SponsorBlock API with manual FFmpeg-based segment removal when needed.
- **Cookie Support**: Optional YouTube cookie integration to bypass age restrictions and other limitations (add cookies to `Cookies/music.youtube.com_cookies.txt`).
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes.
- **Environment Configuration**: Flexible configuration using environment variables.

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (version 14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Python 3.6+** 
   - Download from [python.org](https://www.python.org/downloads/)
   - During installation, make sure to check "Add Python to PATH"

3. **FFmpeg** (for audio processing)
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Add to system PATH for audio conversion and SponsorBlock processing

## Setup

1. Clone the repository (or navigate to the project directory):
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

4. (Optional) Add YouTube cookies for bypassing restrictions:
   - Create a file named `music.youtube.com_cookies.txt` in the `Cookies/` directory
   - Add cookies in Netscape format if bypassing age restrictions is needed
   - The Python YouTube downloader will automatically use these cookies when available

## Configuration

Create a `.env` file in the root directory based on the `.env.example` file:

```env
PORT=3000
PYTHON_PATH=python  # Path to Python executable (default: 'python')
LOG_LEVEL=info      # Logging level (default: 'info')
SPOTIFY_SCRAPER_TIMEOUT=30000  # Timeout for scraper operations in milliseconds (default: 30000)
```

The application will use default values if environment variables are not set.

## Running the Application

Start the server:
```bash
npm start
```

For development with auto-restart on file changes:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /` - Returns a health check message and available endpoints

### Metadata Extraction
- `POST /get-metadata` - Extract metadata from a Spotify URL

#### Example Request:
```bash
curl -X POST http://localhost:3000/get-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "spotifyUrl": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQ3"
  }'
```

#### Example Response:
```json
{
  "TrackName": "Some Track Name",
  "ArtistName": "Artist Name"
}
```

### YouTube URL Fetching
- `POST /get-youtube_url` - Fetch YouTube URL for a track by name and artist

#### Example Request:
```bash
curl -X POST http://localhost:3000/get-youtube_url \
  -H "Content-Type: application/json" \
  -d '{
    "TrackName": "Some Track Name",
    "ArtistName": "Artist Name"
  }'
```

#### Example Response:
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=..."
}
```

### Track Downloading
- `POST /download-track` - Download track from YouTube using Spotify URL (full workflow)

#### Example Request:
```bash
curl -X POST http://localhost:3000/download-track \
  -H "Content-Type: application/json" \
  -d '{
    "spotifyUrl": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQ3"
  }'
```

#### Example Response:
```json
{
  "message": "Track downloaded successfully",
  "path": "downloads/Some Track Name - Artist Name.mp3"
}
```

### Playlist Downloading
- `POST /download-playlist` - Download entire playlist from Spotify URL (full workflow)

#### Example Request:
```bash
curl -X POST http://localhost:3000/download-playlist \
  -H "Content-Type: application/json" \
  -d '{
    "spotifyUrl": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
  }'
```

#### Example Response:
```json
{
  "message": "Playlist download completed. 15 tracks downloaded successfully, 2 tracks failed.",
  "playlistName": "Some Playlist Name",
  "totalTracks": 17,
  "successfulDownloads": 15,
  "failedDownloads": 2,
  "directory": "downloads/Some Playlist Name",
  "details": [
    {
      "track": "Track Name by Artist Name",
      "status": "success",
      "path": "downloads/Some Playlist Name/01 - Track Name - Artist Name.mp3"
    },
    {
      "track": "Another Track by Another Artist", 
      "status": "failed",
      "error": "Could not find YouTube URL"
    }
  ]
}
```

## Architecture Overview

This application uses a Model-View-Controller (MVC) architecture:

### MVC Architecture (`src/`)

#### Models (`src/models/`)
- **SpotifyMetadata.js**: Handles the interaction with Python scripts for extracting Spotify metadata and fetching YouTube URLs
- **track_download.js**: Manages the downloading of tracks from YouTube
- Contains the business logic for data operations and external script execution

#### Controllers (`src/controllers/`)
- **SpotifyController.js**: Manages the request/response flow and implements the application's business logic
- Interacts with models and prepares data for the response
- Orchestrates the complete workflow for track downloading

#### Routes (`src/routes/`)
- **spotifyRoutes.js**: Defines the API endpoints and maps them to controller methods
- Includes input validation and middleware integration
- Provides clear separation between different API endpoints

#### Middleware (`src/middleware/`)
- **validation.js**: Handles input validation for API requests (validates Spotify URLs and Spotify playlist URLs)
- **errorHandler.js**: Manages error handling and provides consistent error responses
- Includes 404 handling for undefined routes

#### Utilities (`src/utils/`)
- **config.js**: Centralized configuration management with environment variable support
- Handles default values and type conversion for configuration options

## File Structure

```
Spotify_Downloader_Backend/
├── .env                    # Environment variables (not committed)
├── .env.example           # Example environment variables
├── .git/                  # Git repository files
├── .qwen/                 # Qwen Code specific files
├── Cookies/               # Directory for YouTube cookies
│   └── music.youtube.com_cookies.txt
├── downloads/             # Directory for downloaded tracks (created automatically)
├── node_modules/          # Node.js dependencies
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Lock file for Node.js dependencies
├── README.md              # This documentation
├── requirements.txt       # Python dependencies
├── server.js              # Main Express server file (MVC entry point)
├── spotify/               # Python scripts for Spotify metadata extraction
│   ├── fetch_youtube_url.py     # Script that searches YouTube for tracks using yt-dlp
│   └── spotify_metadata.py      # Script that uses spotify-scraper to extract metadata
├── src/                   # Source code organized by MVC pattern
│   ├── controllers/       # Request handling and business logic controllers
│   │   └── SpotifyController.js
│   ├── middleware/        # Request processing middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/            # Data models and business logic
│   │   ├── SpotifyMetadata.js
│   │   └── track_download.js
│   ├── routes/            # API route definitions
│   │   └── spotifyRoutes.js
│   └── utils/             # Utility functions and configurations
│       └── config.js
├── tests/                 # Test files
├── youtube/               # Python scripts for YouTube downloading
│   └── youtube_downloader.py     # Script that downloads audio from YouTube with SponsorBlock
└── .gitignore            # Git ignore file
```

## How It Works

### MVC Architecture Workflow
In the architecture:
1. Client sends requests to the main server
2. Requests are routed through `spotifyRoutes.js` to `SpotifyController.js`
3. The controller uses models (`SpotifyMetadata.js` and `track_download.js`) to execute Python scripts
4. Response is returned to the client

### Playlist Downloading Workflow
1. Client sends a POST request to `/download-playlist` with a Spotify playlist URL
2. The controller extracts playlist metadata using `spotify/spotify_playlist.py`
3. A directory is created for the playlist (with sanitized name to remove invalid characters)
4. A `playlist_info.json` file is created containing detailed playlist information
5. Each track in the playlist is downloaded with individual error handling
6. Track files are named with track numbers following the format: `{trackNumber} - {TrackName} - {ArtistName}.mp3` (e.g., `01 - Track Name - Artist Name.mp3`)
7. A comprehensive response is returned with success/failure statistics for each track

### SponsorBlock Processing
The YouTube downloader includes advanced SponsorBlock functionality:
- Fetches segment data from SponsorBlock API
- Automatically trims sponsor, intro, and outro segments using FFmpeg
- Creates clean MP3 files without unwanted content
- Implements manual segment removal when SponsorBlock postprocessor doesn't automatically trim
- Removes temporary container files after successful MP3 creation to save space

## Dependencies

### Node.js Dependencies
- **Express.js**: Web framework for creating the API server
- **dotenv**: Environment variable management
- **nodemon** (dev): Auto-restart server during development

### Python Dependencies
- **spotify-scraper**: For extracting detailed metadata from Spotify URLs
- **yt-dlp**: For searching YouTube and downloading audio content
- **requests**: For HTTP operations and API calls

## Development

### Project Structure
The project follows a clear MVC pattern with separation of concerns:
- **Controllers** handle request/response logic
- **Models** manage data operations and external script interaction
- **Routes** define API endpoints
- **Middleware** provides validation and error handling
- **Utils** contain configuration and helper functions

### Adding New Features
To add new functionality:
1. Add new endpoints to the appropriate route file
2. Create or update controller methods
3. Add or modify model methods if needed
4. Add validation or error handling middleware as needed

### Testing
The project includes a test directory for unit and integration tests (tests can be added following the existing structure).

## Troubleshooting

### Common Issues
If you get a "Python was not found" error:
- Make sure Python is installed and added to your system PATH
- Restart your command prompt/terminal after installing Python
- On Windows, try using `python3` instead of `python` in the config if needed

If you get an error about dependencies not being found:
- Run `pip install -r requirements.txt` to install the required Python packages
- Run `npm install` to install Node.js dependencies
- Ensure you're using Python 3.6+ and Node.js 14+

If YouTube downloads fail:
- Make sure FFmpeg is installed and in your system PATH
- Consider adding YouTube cookies to bypass restrictions (see Setup section)

For any other issues:
- Check that the Spotify URL format is correct
- Verify that your server is running on the correct port
- Review the console logs for specific error messages
- Ensure all dependencies are properly installed

### Log Levels
The application supports different log levels that can be configured via the LOG_LEVEL environment variable:
- `info`: Informational messages (default)
- `error`: Error messages only
- `debug`: Detailed debug information

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the developers of `spotify-scraper` for the metadata extraction library
- Thanks to the `yt-dlp` team for the powerful YouTube downloading tool
- Thanks to the SponsorBlock project for the content skipping functionality