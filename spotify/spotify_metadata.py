import sys
import json
import re
from urllib.parse import urlparse, parse_qs



# Try to use spotify_scraper if available
import logging
# Suppress external package's logging to prevent stdout pollution
logging.getLogger("spotify_scraper").setLevel(logging.CRITICAL)
logging.getLogger().setLevel(logging.CRITICAL)  # Set root logger to critical
from spotify_scraper import SpotifyClient

def extract_metadata(spotify_url):
        # Initialize client
        client = SpotifyClient()

        try:
            # Get track data
            track = client.get_track_info(spotify_url)

            # Format and return the result
            result = {
                'success': True,
                'metadata': {
                    'title': track.get('name', 'Unknown'),
                    'artist': ', '.join([artist['name'] for artist in track.get('artists', [])]) if track.get('artists') else 'Unknown',
                    'album': track.get('album', {}).get('name', 'Unknown'),
                    'duration_ms': track.get('duration_ms', 0),
                    'duration_s': track.get('duration_ms', 0) / 1000 if track.get('duration_ms') else 0,
                    'release_date': track.get('album', {}).get('release_date', ''),
                    'track_id': track.get('id', ''),
                    'track_url': spotify_url,
                    'preview_url': track.get('preview_url', ''),
                    'external_urls': track.get('external_urls', {}),
                    'available_markets': track.get('available_markets', []),
                    'disc_number': track.get('disc_number', 1),
                    'track_number': track.get('track_number', 0),
                    'popularity': track.get('popularity', 0),
                    'explicit': track.get('explicit', False),
                    'isrc': track.get('external_ids', {}).get('isrc', ''),
                    'label': track.get('label', ''),
                    'copyrights': track.get('copyrights', []),
                    'artists': track.get('artists', [])
                }
            }
            
            print(json.dumps(result))
            return result
        except Exception as e:
            result = {
                'success': False,
                'error': f'Error extracting track info: {str(e)}'
            }
            print(json.dumps(result))
            sys.exit(1)
        finally:
            # Close the client
            client.close()
            


if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'No Spotify URL provided'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    spotify_url = sys.argv[1]
    extract_metadata(spotify_url)
