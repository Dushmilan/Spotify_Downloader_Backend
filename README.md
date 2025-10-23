# Spotify Metadata API

A simple API that extracts Spotify track metadata using the spotify-scraper library, built with a clean Model-View-Controller (MVC) architecture.

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (version 14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
2. **Python 3.6+** 
   - Download from [python.org](https://www.python.org/downloads/)
   - During installation, make sure to check "Add Python to PATH"

## Setup

1. Clone the repository (or navigate to the project directory):
```bash
git clone <your-repo-url>
cd Spotify_Metadata_API
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

Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

- `GET /` - Health check to confirm the server is running
- `POST /get-metadata` - Extract metadata from a Spotify URL

### Example Request:
```bash
curl -X POST http://localhost:3000/get-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "spotifyUrl": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQ3"
  }'
```

### Example Response:
```json
{
  "success": true,
  "metadata": {
    "title": "Some Track Name",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration_ms": 213000,
    "release_date": "2023-01-01",
    "track_id": "4uLU6hMCjMI75M1A2tKUQ3",
    "track_url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQ3",
    "preview_url": "https://p.scdn.co/mp3-preview/...",
    "external_urls": {
      "spotify": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQ3"
    },
    "available_markets": ["US", "CA", "GB"],
    "disc_number": 1,
    "track_number": 1,
    "popularity": 85,
    "explicit": false
  }
}
```

## Architecture Overview

This application follows the Model-View-Controller (MVC) architectural pattern for better organization, maintainability, and scalability:

### Models (`src/models/`)
- **SpotifyMetadata.js**: Handles the interaction with the Python script for extracting Spotify metadata
- Contains the business logic for data operations

### Controllers (`src/controllers/`)
- **SpotifyController.js**: Manages the request/response flow and implements the application's business logic
- Interacts with models and prepares data for the response

### Routes (`src/routes/`)
- **spotifyRoutes.js**: Defines the API endpoints and maps them to controller methods
- Includes input validation and middleware integration

### Middleware (`src/middleware/`)
- **validation.js**: Handles input validation for API requests
- **errorHandler.js**: Manages error handling and provides consistent error responses

### Utilities (`src/utils/`)
- **config.js**: Centralized configuration management with environment variable support

## How it Works

1. Client sends a POST request to `/get-metadata` with a Spotify URL
2. The request passes through validation middleware
3. The controller validates the Spotify URL format
4. The model executes a Python script using the spotify-scraper library to extract track metadata
5. The metadata is returned as a JSON response
6. If the spotify-scraper library is not available, the application falls back to web scraping

## Configuration

The application can be configured using environment variables:

```env
PORT=3000
PYTHON_PATH=python  # Path to Python executable (default: 'python')
LOG_LEVEL=info      # Logging level (default: 'info')
SPOTIFY_SCRAPER_TIMEOUT=30000  # Timeout for scraper operations in milliseconds
```

Create a `.env` file in the root directory with these values to customize your setup.

## Development

For development with auto-restart on file changes:

```bash
npm run dev
```

## File Structure

```
Spotify_Metadata_API/
├── server.js               # Main Express server file (MVC entry point)
├── src/                    # Source code organized by MVC pattern
│   ├── models/             # Data models and business logic
│   │   └── SpotifyMetadata.js
│   ├── controllers/        # Request handling and business logic controllers
│   │   └── SpotifyController.js
│   ├── routes/             # API route definitions
│   │   └── spotifyRoutes.js
│   ├── middleware/         # Request processing middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   └── utils/              # Utility functions and configurations
│       └── config.js
├── spotify/                # Python scripts for metadata extraction
│   ├── spotify_metadata.py # Script that uses spotify-scraper
│   ├── youtube_search.py # Script that searches YouTube for tracks using yt-dlp
│   └── combined_metadata.py # Script that combines Spotify metadata and YouTube URL
├── package.json            # Node.js dependencies and scripts
├── requirements.txt        # Python dependencies
├── README.md               # This documentation
├── .env.example            # Example environment variables
└── .env                    # Environment variables (not committed)
```

## Troubleshooting

If you get a "Python was not found" error:
- Make sure Python is installed and added to your system PATH
- Restart your command prompt/terminal after installing Python
- On Windows, try using `python3` instead of `python` in server.js if needed

If you get an error about spotify-scraper not being found:
- Run `pip install -r requirements.txt` to install the required Python packages
- Ensure you're using Python 3.6 or higher

For any other issues:
- Check that the Spotify URL format is correct
- Verify that your server is running on the correct port
- Review the console logs for specific error messages

## Dependencies

- **Node.js**: Express.js for the web server, dotenv for configuration management
- **Python**: 
  - `spotify-scraper` for extracting metadata from Spotify
  - `requests` for HTTP operations (fallback mechanism)