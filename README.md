# Spotify Metadata API

A simple API that extracts Spotify track metadata using the spotify-scraper library.

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

## How it Works

1. Client sends a POST request to `/get-metadata` with a Spotify URL
2. The application validates the Spotify URL format
3. A Python script is executed that uses the spotify-scraper library to extract track metadata
4. The metadata is returned as a JSON response
5. If the spotify-scraper library is not available, the application falls back to web scraping

## Configuration

The application can be configured using environment variables:

```env
PORT=3000
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
├── server.js               # Main Express server file
├── spotify/                # Python scripts for metadata extraction
│   └── spotify_metadata.py # Script that uses spotify-scraper
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

- **Node.js**: Express.js for the web server
- **Python**: 
  - `spotify-scraper` for extracting metadata from Spotify
  - `requests` for HTTP operations (fallback mechanism)