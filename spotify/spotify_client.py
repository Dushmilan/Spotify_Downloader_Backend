import requests
from urllib.parse import urlparse, parse_qs
import os
import sys

class SpotifyClient:
    def __init__(self):
        self.session = requests.Session()
        # Set a user agent to avoid being blocked
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Check if we have Spotify API credentials in environment variables
        self.client_id = os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        self.access_token = None

    def _get_access_token(self):
        """Get Spotify API access token using client credentials flow"""
        if self.client_id and self.client_secret:
            try:
                token_url = 'https://accounts.spotify.com/api/token'
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
                data = {
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret
                }
                
                response = self.session.post(token_url, headers=headers, data=data)
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data['access_token']
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.access_token}'
                    })
                    return self.access_token
            except Exception as e:
                print(f"Error getting Spotify access token: {str(e)}")
        
        print("No Spotify API credentials found, using web scraping approach")
        return None

    def get_track_info(self, track_url):
        """
        Extract track information from a Spotify URL using the Spotify Web API
        """
        try:
            # Parse the track ID from the URL
            parsed_url = urlparse(track_url)
            path_parts = parsed_url.path.strip('/').split('/')
            
            # Extract track ID from URL (works for various Spotify URL formats)
            track_id = None
            if len(path_parts) >= 2 and path_parts[0] == 'track':
                # Format: open.spotify.com/track/{id}
                track_id = path_parts[1]
            else:
                # Look for 22-character base62 string in path parts
                for part in path_parts:
                    if len(part) == 22 and all(c in '0123456789abcdefghijklmnopqrstuvwxyz' for c in part.lower()):
                        track_id = part
                        break
            
            if not track_id:
                # Try to extract from query parameters as fallback
                query_params = parse_qs(parsed_url.query)
                track_ids = query_params.get('uri', [])
                if track_ids and track_ids[0].startswith('spotify:track:'):
                    track_id = track_ids[0].split(':')[-1]
            
            if not track_id:
                raise ValueError("Could not extract track ID from URL")
            
            # If we have Spotify API credentials, use the official API
            if self.client_id and self.client_secret and self._get_access_token():
                # Use the official Spotify API
                api_url = f'https://api.spotify.com/v1/tracks/{track_id}'
                response = self.session.get(api_url)
                
                if response.status_code == 200:
                    track_data = response.json()
                    return {
                        'id': track_data.get('id'),
                        'name': track_data.get('name', 'Unknown Track'),
                        'artists': track_data.get('artists', []),
                        'album': track_data.get('album', {}),
                        'duration_ms': track_data.get('duration_ms'),
                        'external_urls': track_data.get('external_urls', {}),
                        'preview_url': track_data.get('preview_url')
                    }
                else:
                    print(f"Spotify API request failed: {response.status_code}")
            
            # If no API credentials or API request failed, try to extract information from the web page
            # This is a fallback that might work without API credentials, but is less reliable
            print("Using web scraping fallback to get track info...", file=sys.stderr)
            web_url = f'https://open.spotify.com/track/{track_id}'
            response = self.session.get(web_url)
            
            if response.status_code == 200:
                content = response.text
                
                # Try to extract track info from the page content
                # Look for JSON-LD structured data first
                import re
                
                # Try to find JSON-LD structured data in the page
                jsonld_match = re.search(r'<script type="application/ld\+json">([^<]*)</script>', content)
                if jsonld_match:
                    import json as json_module
                    try:
                        structured_data = json_module.loads(jsonld_match.group(1))
                        if structured_data.get('@type') == 'MusicRecording':
                            name = structured_data.get('name', 'Unknown Track')
                            # Extract artist information
                            artist_data = structured_data.get('byArtist', {})
                            if isinstance(artist_data, list):
                                artists = [{'name': artist.get('name', 'Unknown Artist')} for artist in artist_data]
                            elif isinstance(artist_data, dict):
                                artists = [{'name': artist_data.get('name', 'Unknown Artist')}]
                            else:
                                artist_name = structured_data.get('byArtist', 'Unknown Artist')
                                artists = [{'name': str(artist_name)}]
                            
                            album_data = structured_data.get('inAlbum', {})
                            album_name = album_data.get('name', 'Unknown Album') if album_data else 'Unknown Album'
                            
                            duration = structured_data.get('duration', 'PT0S')  # ISO 8601 duration format
                            # Convert ISO 8601 duration to milliseconds (simplified)
                            duration_ms = 0
                            if 'PT' in duration and 'S' in duration:
                                # Extract seconds - this is a simplified conversion
                                seconds_match = re.search(r'(\d+)S', duration)
                                if seconds_match:
                                    duration_ms = int(seconds_match.group(1)) * 1000
                            
                            return {
                                'id': track_id,
                                'name': name,
                                'artists': artists,
                                'album': {'name': album_name},
                                'duration_ms': duration_ms,
                                'external_urls': {'spotify': track_url},
                                'preview_url': None
                            }
                    except (json_module.JSONDecodeError, ValueError):
                        pass  # If JSON parsing fails, continue to other methods
                
                # Fallback: Extract from page title
                title_match = re.search(r'<title[^>]*>([^<]*)', content)
                if title_match:
                    full_title = title_match.group(1)
                    # Remove ' - Spotify' suffix
                    clean_title = full_title.replace(' - Spotify', '').strip()
                    
                    # Handle different title formats
                    # Format might be: "Song Title - Single by Artist Name | Spotify"
                    # Or: "Artist Name · Song Title | Spotify"
                    # Or: "Song Title by Artist Name | Spotify"
                    
                    song_title = clean_title
                    artist_name = 'Unknown Artist'
                    
                    # Look for "by" pattern
                    if ' by ' in clean_title and ' | ' in clean_title:
                        parts = clean_title.split(' | ')
                        main_part = parts[0]
                        by_parts = main_part.split(' by ')
                        if len(by_parts) >= 2:
                            song_title = by_parts[0].strip()
                            artist_name = by_parts[1].strip()
                        else:
                            # Try "Artist · Song" format
                            andy_parts = main_part.split(' · ')
                            if len(andy_parts) >= 2:
                                artist_name = andy_parts[0].strip()
                                song_title = andy_parts[1].strip()
                    # Look for "Artist · Song" format
                    elif ' · ' in clean_title:
                        parts = clean_title.split(' · ')
                        if len(parts) >= 2:
                            artist_name = parts[0].strip()
                            song_title = parts[1].strip()
                        else:
                            song_title = clean_title
                    # Look for "Artist - Song" format
                    elif ' - ' in clean_title:
                        # Check if it's "Song - Album by Artist" or "Artist - Song"
                        parts = clean_title.split(' - ')
                        if len(parts) >= 2:
                            # More likely "Artist - Song" format
                            artist_name = parts[0].strip()
                            song_title = ' - '.join(parts[1:]).strip()
                        else:
                            song_title = clean_title
                    else:
                        song_title = clean_title
                else:
                    song_title = 'Unknown Track'
                    artist_name = 'Unknown Artist'
                
                return {
                    'id': track_id,
                    'name': song_title,
                    'artists': [{'name': artist_name}],
                    'album': {'name': 'Unknown Album'},
                    'duration_ms': 0,  # Unknown
                    'external_urls': {'spotify': track_url},
                    'preview_url': None
                }
            else:
                # If web scraping also fails, return an error
                raise ValueError(f"Could not retrieve track info for ID: {track_id}")
                
        except Exception as e:
            print(f"Error extracting track info: {str(e)}")
            raise

    def close(self):
        """Close the session"""
        self.session.close()