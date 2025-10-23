import sys
import json
import re
from urllib.parse import urlparse, parse_qs

try:
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
            
except ImportError:
    # Fallback implementation if spotify_scraper is not available
    import requests
    
    def extract_metadata(spotify_url):
        # Extract track ID from URL
        parsed_url = urlparse(spotify_url)
        path_parts = parsed_url.path.strip('/').split('/')
        
        track_id = None
        if len(path_parts) >= 2 and path_parts[0] == 'track':
            track_id = path_parts[1]
        elif len(path_parts) >= 1:
            for part in path_parts:
                if len(part) == 22 and all(c in '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in part):
                    track_id = part
                    break
        
        if not track_id:
            query_params = parse_qs(parsed_url.query)
            track_ids = query_params.get('uri', [])
            if track_ids and track_ids[0].startswith('spotify:track:'):
                track_id = track_ids[0].split(':')[-1]
        
        if not track_id:
            result = {
                'success': False,
                'error': 'Could not extract track ID from URL'
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Attempt to extract metadata via web scraping as fallback
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(spotify_url, headers=headers)
            
            if response.status_code == 200:
                content = response.text
                
                # Extract title and artist from HTML
                # This is a simplified extraction and may not work for all cases
                title_match = re.search(r'<title[^>]*>([^<]*)', content)
                
                if title_match:
                    full_title = title_match.group(1)
                    # Clean up the title
                    clean_title = full_title.replace(' - Spotify', '').strip()
                    
                    # Try to separate artist and track name
                    artist_name = 'Unknown'
                    track_name = clean_title
                    
                    if ' · ' in clean_title:
                        parts = clean_title.split(' · ', 1)
                        if len(parts) >= 2:
                            artist_name = parts[0].strip()
                            track_name = parts[1].strip()
                    elif ' - ' in clean_title:
                        parts = clean_title.split(' - ', 1)
                        if len(parts) >= 2:
                            artist_name = parts[0].strip()
                            track_name = parts[1].strip()
                    
                    result = {
                        'success': True,
                        'metadata': {
                            'title': track_name,
                            'artist': artist_name,
                            'album': 'Unknown',
                            'duration_ms': 0,
                            'duration_s': 0,
                            'release_date': '',
                            'track_id': track_id,
                            'track_url': spotify_url,
                            'preview_url': None,
                            'external_urls': {'spotify': spotify_url},
                            'available_markets': [],
                            'disc_number': 1,
                            'track_number': 0,
                            'popularity': 0,
                            'explicit': False,
                            'isrc': '',
                            'label': '',
                            'copyrights': [],
                            'artists': [{'name': artist_name}]
                        }
                    }
                    
                    print(json.dumps(result))
                    return result
                else:
                    result = {
                        'success': False,
                        'error': 'Could not extract metadata from page'
                    }
                    print(json.dumps(result))
                    sys.exit(1)
            else:
                result = {
                    'success': False,
                    'error': f'HTTP error: {response.status_code}'
                }
                print(json.dumps(result))
                sys.exit(1)
        except Exception as e:
            result = {
                'success': False,
                'error': f'Error during scraping: {str(e)}'
            }
            print(json.dumps(result))
            sys.exit(1)

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