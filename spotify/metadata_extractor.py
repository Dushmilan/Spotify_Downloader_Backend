import sys
import json
from spotify_scraper import SpotifyClient

def extract_metadata(track_url):
    # Initialize the client
    client = SpotifyClient()
    
    try:
        # Extract track information
        track = client.get_track_info(track_url)
        
        # Format the result as JSON for the Node.js server to parse
        result = {
            'title': track.get('name', 'Unknown'),
            'artist': track.get('artists', [{}])[0].get('name', 'Unknown') if track.get('artists') else 'Unknown',
            'duration': track.get('duration_ms', 0) / 1000,
            'album': track.get('album', {}).get('name', 'Unknown'),
            'release_date': track.get('album', {}).get('release_date', ''),
            'track_url': track_url
        }
        
        # Print JSON result to stdout
        print(json.dumps(result))
        
        return result
    finally:
        # Always close when done
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No Spotify URL provided'}), file=sys.stderr)
        sys.exit(1)
    
    track_url = sys.argv[1]
    extract_metadata(track_url)