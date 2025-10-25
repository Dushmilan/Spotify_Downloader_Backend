# Spotify Downloader Backend

A comprehensive API that extracts Spotify track metadata and downloads tracks from YouTube using a combination of Node.js and Python. The project leverages the `spotify-scraper` library for metadata extraction and `yt-dlp` for YouTube downloads, built with a clean Model-View-Controller (MVC) architecture.

## Features

- **Spotify Metadata Extraction**: Extract detailed information from Spotify URLs including title, artist, album, duration, release date, track ID, preview URL, and more.
- **YouTube URL Fetching**: Search and retrieve the best matching YouTube URL for a given track and artist.
- **Track Downloading**: Download audio from YouTube as MP3 files with SponsorBlock integration to skip unwanted segments.
- **Playlist Downloading**: Download entire Spotify playlists with track numbering and organization, including playlist metadata in a JSON file.
- **SponsorBlock Integration**: Automatically skips sponsor segments, intros, and outros using SponsorBlock API with manual FFmpeg-based segment removal when needed.
- **Cookie Support**: Optional YouTube cookie integration to bypass age restrictions and other limitations (add cookies to `Cookies/music.youtube.com_cookies.txt`).
- **Microservices Architecture**: Scalable architecture with separate services for metadata, search, and download functionality.
- **API Gateway**: Centralized entry point that routes requests to appropriate services.
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

### Legacy Monolithic Application
Start the original server (for backward compatibility):
```bash
npm start
```

For development with auto-restart on file changes:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Microservices Architecture (Recommended)
To run the new microservices architecture:

1. Make sure you have Python and Node.js installed on your system

2. Install dependencies for each service:
   - For API Gateway: `cd microservices/api-gateway && npm install`
   - For Metadata Service: `cd microservices/metadata-service && pip install -r requirements.txt`
   - For Search Service: `cd microservices/search-service && pip install -r requirements.txt`
   - For Download Service: `cd microservices/download-service && pip install -r requirements.txt`

3. Run each service in separate terminals:
   - API Gateway (port 3000): `cd microservices/api-gateway && npm start`
   - Metadata Service (port 3001): `cd microservices/metadata-service && python app.py`
   - Search Service (port 3002): `cd microservices/search-service && python app.py`
   - Download Service (port 3003): `cd microservices/download-service && python app.py`

4. The API Gateway will be available at `http://localhost:3000`

Note: All services must be running for the full functionality to work. The API Gateway routes requests to the appropriate services.

## Testing the Microservices Architecture

The following test files are provided to verify the functionality of the microservices architecture:

1. `test_metadata_service.js` - Tests the metadata service directly
2. `test_search_service.js` - Tests the search service directly  
3. `test_download_service.js` - Tests the download service directly
4. `test_playlist_service.js` - Tests the playlist download service directly
5. `test_full_workflow.js` - Tests the complete workflow via the API Gateway

Each test file uses the sample URLs provided:
- Sample Track: `https://open.spotify.com/track/4t7zKQ4BiRxjnSwlFBL9G3?si=37c11342c9ee435b`
- Sample Playlist: `https://open.spotify.com/playlist/6d7vltVjUg8cia1Htfw9QU?si=ff8b813ed1734b28`

### Running Tests

To run the tests, first make sure all services are running as described in the "Running the Application" section above. Then run any test file with Node.js:

```bash
# Navigate to the microservices directory
cd microservices

# Run a specific test
node test_metadata_service.js

# Or run the full workflow test
node test_full_workflow.js
```

Each test file includes instructions for running its corresponding service if it's not already running.

### Individual Service Development
You can also run individual services for development:

1. Navigate to a service directory (e.g., `microservices/api-gateway`)
2. Install dependencies: `npm install`
3. Run the service: `npm start` or `npm run dev`

For Python services:
1. Navigate to a Python service directory (e.g., `microservices/metadata-service`)
2. Install Python dependencies: `pip install -r requirements.txt`
3. Run the service: `python app.py`

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

This application now supports both a legacy Model-View-Controller (MVC) architecture and a modern microservices architecture:

### Legacy MVC Architecture (`src/`)
For backward compatibility, the original MVC architecture is still available:

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

### Modern Microservices Architecture (`microservices/`)
The new architecture provides better scalability, maintainability, and fault isolation:

#### API Gateway (`microservices/api-gateway/`)
- **server.js**: Main entry point that routes requests to appropriate services
- Handles cross-cutting concerns like authentication, rate limiting, and CORS
- Aggregates responses from multiple backend services
- Forwards requests to specialized services based on endpoint

#### Metadata Service (`microservices/metadata-service/`)
- **app.py**: Python Flask application that handles all Spotify metadata extraction operations
- Executes Python scripts for metadata extraction
- Provides caching for frequently requested metadata
- Maintains the same Python integration as the legacy version

#### Search Service (`microservices/search-service/`)
- **app.py**: Python Flask application that handles YouTube URL fetching operations
- Executes Python scripts for YouTube search
- Provides clean separation of search functionality
- Maintains the same search quality and accuracy as the legacy version

#### Download Service (`microservices/download-service/`)
- **app.py**: Python Flask application that handles audio download and processing operations
- Manages both single track and playlist downloads
- Implements SponsorBlock integration and FFmpeg processing
- Handles file organization and storage coordination

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
├── server.js              # Main Express server file (legacy - MVC entry point)
├── spotify/               # Python scripts for Spotify metadata extraction
│   ├── fetch_youtube_url.py     # Script that searches YouTube for tracks using yt-dlp
│   └── spotify_metadata.py      # Script that uses spotify-scraper to extract metadata
├── src/                   # Source code organized by MVC pattern (legacy)
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
├── microservices/         # New microservices architecture
│   ├── api-gateway/       # API Gateway service (Node.js/Express)
│   │   ├── server.js      # Main gateway server
│   │   ├── package.json   # Dependencies for API Gateway
│   │   └── src/           # Source files
│   ├── metadata-service/  # Metadata service (Python Flask)
│   │   ├── app.py         # Metadata service Flask application
│   │   ├── requirements.txt # Python dependencies for metadata service
│   │   └── src/           # Source files
│   ├── search-service/    # Search service (Python Flask)
│   │   ├── app.py         # Search service Flask application
│   │   ├── requirements.txt # Python dependencies for search service
│   │   └── src/           # Source files
│   └── download-service/  # Download service (Python Flask)
│       ├── app.py         # Download service Flask application
│       ├── requirements.txt # Python dependencies for download service
│       └── src/           # Source files
└── .gitignore            # Git ignore file
```

## Microservices Architecture

The application now uses a microservices architecture with the following services:

### API Gateway (`microservices/api-gateway/`)
- Main entry point for all client requests
- Handles request routing to appropriate services
- Provides authentication and authorization middleware
- Implements rate limiting and request logging
- Aggregates responses from multiple services
- Manages CORS and security headers

### Metadata Service (`microservices/metadata-service/`)
- Handles Spotify metadata extraction using existing Python scripts
- Provides `/metadata` endpoint for extracting Spotify track information
- Implements caching layer for frequently requested metadata
- Maintains the same functionality as the original implementation

### Search Service (`microservices/search-service/`)
- Handles YouTube URL fetching using existing Python scripts
- Provides `/youtube-url` endpoint for searching YouTube
- Maintains the same search functionality as the original implementation

### Download Service (`microservices/download-service/`)
- Handles audio download and processing using existing Python scripts
- Manages both single track and playlist downloads
- Implements SponsorBlock integration and FFmpeg processing
- Handles file management and storage coordination

## How It Works

### Legacy MVC Architecture Workflow
In the original architecture:
1. Client sends requests to the main server
2. Requests are routed through `spotifyRoutes.js` to `SpotifyController.js`
3. The controller uses models (`SpotifyMetadata.js` and `track_download.js`) to execute Python scripts
4. Response is returned to the client

### Microservices Architecture Workflow (Recommended)
In the new microservices architecture:

#### API Gateway
1. Client sends requests to the API Gateway at `/get-metadata`, `/get-youtube_url`, `/download-track`, or `/download-playlist`
2. Gateway validates request format and forwards to appropriate service
3. Gateway aggregates results from services and returns to client

#### Metadata Service
1. Client request reaches the API Gateway which forwards to Metadata Service
2. Metadata Service executes Python script (`spotify/spotify_metadata.py`) using the spotify-scraper library to extract track metadata
3. Response is returned through the API Gateway to the client

#### Search Service
1. Client request reaches the API Gateway which forwards to Search Service
2. Search Service executes Python script (`spotify/fetch_youtube_url.py`) using yt-dlp to search YouTube for the track
3. Response is returned through the API Gateway to the client

#### Download Service
1. Client request reaches the API Gateway which forwards to Download Service
2. Download Service orchestrates the process by first getting metadata, then the YouTube URL, then downloading the audio
3. Download Service executes Python scripts for each step (`spotify/spotify_metadata.py`, `spotify/fetch_youtube_url.py`, and `youtube/youtube_downloader.py`)
4. Results are saved to the `downloads/` directory
5. Response is returned through the API Gateway to the client

### Playlist Downloading Workflow (New Feature)
1. Client sends a POST request to `/download-playlist` with a Spotify playlist URL (through API Gateway)
2. The request is forwarded to the Download Service
3. The controller extracts playlist metadata using `spotify/spotify_playlist.py`
4. A directory is created for the playlist (with sanitized name to remove invalid characters)
5. A `playlist_info.json` file is created containing detailed playlist information
6. Each track in the playlist is downloaded with individual error handling
7. Track files are named with track numbers following the format: `{trackNumber} - {TrackName} - {ArtistName}.mp3` (e.g., `01 - Track Name - Artist Name.mp3`)
8. A comprehensive response is returned with success/failure statistics for each track

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