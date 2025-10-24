import sys
import json
import logging
from urllib.parse import urlparse

# Suppress external package's logging to prevent stdout pollution
logging.getLogger("spotify_scraper").setLevel(logging.CRITICAL)
logging.getLogger().setLevel(logging.CRITICAL)

from spotify_scraper import SpotifyClient


def extract_playlist_metadata(spotify_url):
    """
    Extract metadata from a Spotify playlist URL
    
    Args:
        spotify_url (str): The Spotify playlist URL
    
    Returns:
        dict: Playlist metadata including name, owner, description, and tracks
    """
    client = SpotifyClient()
    
    try:
        # Get playlist data
        playlist = client.get_playlist_info(spotify_url)
        
        # More comprehensive debug: Check what type of object we got and its content
        print(f"DEBUG: Type of playlist object: {type(playlist)}", file=sys.stderr)
        if isinstance(playlist, list):
            print(f"DEBUG: Playlist is a list with {len(playlist)} items. First item type: {type(playlist[0]) if len(playlist) > 0 else 'N/A'}", file=sys.stderr)
            result = {
                'success': False,
                'error': f'Unexpected response type: list instead of dict. First few items: {playlist[:2] if len(playlist) > 0 else []}'
            }
            print(json.dumps(result))
            sys.exit(1)
        elif not isinstance(playlist, dict):
            print(f"DEBUG: Playlist is {type(playlist)} type instead of dict", file=sys.stderr)
            result = {
                'success': False,
                'error': f'Unexpected response type: {type(playlist)}. Expected dict.'
            }
            print(json.dumps(result))
            sys.exit(1)
        else:
            print(f"DEBUG: Playlist is a dict with keys: {list(playlist.keys())}", file=sys.stderr)
        
        # Get the tracks from the playlist, handling both dict and list formats
        playlist_tracks_raw = playlist.get('tracks', [])
        
        result = {
            'success': True,
            'playlist': {
                'name': playlist.get('name', 'Unknown Playlist'),
                'owner': playlist.get('owner', {}).get('display_name', 'Unknown Owner'),
                'description': playlist.get('description', ''),
                'track_count': playlist.get('track_count', 0),  # Using direct access since 'tracks' might be a list
                'id': playlist.get('id', ''),
                'url': spotify_url,
                'external_urls': playlist.get('external_urls', {}),
                'followers': playlist.get('followers', {}).get('total', 0),
                'images': playlist.get('images', []),  # List of images with different sizes
                'public': playlist.get('public', None),  # Can be True, False, or None
                'collaborative': playlist.get('collaborative', False),
                'tracks': []
            }
        }
        
        # Process each track in the playlist
        playlist_tracks = playlist.get('tracks', {})
        if isinstance(playlist_tracks, dict) and 'items' in playlist_tracks:
            for item in playlist_tracks['items']:
                track_data = item.get('track', {})
                if track_data and track_data.get('id'):  # Only add tracks that have valid data
                    track_info = {
                        'id': track_data.get('id', ''),
                        'title': track_data.get('name', 'Unknown Title'),
                        'artist': ', '.join([artist['name'] for artist in track_data.get('artists', [])]) if track_data.get('artists') else 'Unknown Artist',
                        'album': track_data.get('album', {}).get('name', 'Unknown Album'),
                        'duration_ms': track_data.get('duration_ms', 0),
                        'duration_s': track_data.get('duration_ms', 0) / 1000 if track_data.get('duration_ms') else 0,
                        'track_number': track_data.get('track_number', 0),
                        'disc_number': track_data.get('disc_number', 1),
                        'explicit': track_data.get('explicit', False),
                        'preview_url': track_data.get('preview_url', ''),
                        'external_urls': track_data.get('external_urls', {}),
                        'available_markets': track_data.get('available_markets', []),
                        'isrc': track_data.get('external_ids', {}).get('isrc', ''),
                        'added_at': item.get('added_at', ''),  # When the track was added to the playlist
                        'added_by': item.get('added_by', {}).get('display_name', '') if item.get('added_by') else ''
                    }
                    result['playlist']['tracks'].append(track_info)
        elif isinstance(playlist_tracks, list):
            # Handle the case where tracks is a list directly
            for item in playlist_tracks:
                # When tracks is a list, each item might be the track itself rather than a wrapper
                if isinstance(item, dict):
                    if 'id' in item:  # This item is a track directly
                        track_info = {
                            'id': item.get('id', ''),
                            'title': item.get('name', 'Unknown Title'),
                            'artist': ', '.join([artist['name'] for artist in item.get('artists', [])]) if item.get('artists') else 'Unknown Artist',
                            'album': item.get('album', {}).get('name', 'Unknown Album'),
                            'duration_ms': item.get('duration_ms', 0),
                            'duration_s': item.get('duration_ms', 0) / 1000 if item.get('duration_ms') else 0,
                            'track_number': item.get('track_number', 0),
                            'disc_number': item.get('disc_number', 1),
                            'explicit': item.get('explicit', False),
                            'preview_url': item.get('preview_url', ''),
                            'external_urls': item.get('external_urls', {}),
                            'available_markets': item.get('available_markets', []),
                            'isrc': item.get('external_ids', {}).get('isrc', ''),
                            'added_at': '',  # No added_at when tracks is a list
                            'added_by': ''
                        }
                        result['playlist']['tracks'].append(track_info)
                    else:  # Item is a wrapper containing a track
                        track_data = item.get('track', {})
                        if track_data and track_data.get('id'):
                            track_info = {
                                'id': track_data.get('id', ''),
                                'title': track_data.get('name', 'Unknown Title'),
                                'artist': ', '.join([artist['name'] for artist in track_data.get('artists', [])]) if track_data.get('artists') else 'Unknown Artist',
                                'album': track_data.get('album', {}).get('name', 'Unknown Album'),
                                'duration_ms': track_data.get('duration_ms', 0),
                                'duration_s': track_data.get('duration_ms', 0) / 1000 if track_data.get('duration_ms') else 0,
                                'track_number': track_data.get('track_number', 0),
                                'disc_number': track_data.get('disc_number', 1),
                                'explicit': track_data.get('explicit', False),
                                'preview_url': track_data.get('preview_url', ''),
                                'external_urls': track_data.get('external_urls', {}),
                                'available_markets': track_data.get('available_markets', []),
                                'isrc': track_data.get('external_ids', {}).get('isrc', ''),
                                'added_at': item.get('added_at', ''),
                                'added_by': item.get('added_by', {}).get('display_name', '') if item.get('added_by') else ''
                            }
                            result['playlist']['tracks'].append(track_info)
        
        print(json.dumps(result))
        return result
        
    except Exception as e:
        # Check if the error is related to 'list' object has no attribute 'get'
        error_msg = str(e)
        if "'list' object has no attribute 'get'" in error_msg:
            # This means the API returned a list when we expected a dict
            result = {
                'success': False,
                'error': f"'list' object has no attribute 'get'. This suggests the API returned an unexpected format. Please check if the playlist URL is valid and the spotify_scraper library is working correctly."
            }
        else:
            result = {
                'success': False,
                'error': f'Error extracting playlist info: {error_msg}'
            }
        print(json.dumps(result))
        sys.exit(1)
    finally:
        # Close the client
        try:
            client.close()
        except:
            # If closing fails, just continue
            pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'No Spotify playlist URL provided'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    spotify_url = sys.argv[1]
    
    # Basic validation to ensure it's a playlist URL
    if 'playlist' not in spotify_url.lower():
        result = {
            'success': False,
            'error': 'URL does not appear to be a Spotify playlist'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    extract_playlist_metadata(spotify_url)