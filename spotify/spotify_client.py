import sys

# Try to import from spotify_scraper package if available, otherwise use our implementation
try:
    import logging
    # Suppress external package's logging to prevent stdout pollution
    logging.getLogger("spotify_scraper").setLevel(logging.CRITICAL)
    logging.getLogger().setLevel(logging.CRITICAL)  # Set root logger to critical
    from spotify_scraper import SpotifyClient as ExternalSpotifyClient
    # If import is successful, use the external package
    print("Using spotify_scraper package", file=sys.stderr)
    
    # Create a wrapper class that uses spotify_scraper and falls back to our implementation
    class SpotifyClient:
        def __init__(self):
            self.client = ExternalSpotifyClient()
            self.fallback_client = self._get_fallback_client()
        
        def _get_fallback_client(self):
            # Import and return our fallback implementation
            import requests
            from urllib.parse import urlparse, parse_qs
            import os
            import re
            import json

            class FallbackSpotifyClient:
                def __init__(self):
                    self.session = requests.Session()
                    # Set a user agent to avoid being blocked
                    self.session.headers.update({
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                    })

                def get_track_info(self, track_url):
                    """
                    Extract track information from a Spotify URL using basic web scraping
                    as a fallback when the main scraper fails
                    """
                    try:
                        import re
                        from urllib.parse import urlparse, parse_qs
                        
                        # Parse the track ID from the URL
                        parsed_url = urlparse(track_url)
                        path_parts = parsed_url.path.strip('/').split('/')

                        # Extract track ID from URL (works for various Spotify URL formats)
                        track_id = None
                        if len(path_parts) >= 2 and path_parts[0] == 'track':
                            # Format: open.spotify.com/track/{id}
                            track_id = path_parts[1]
                        elif len(path_parts) >= 1:
                            # Check any path part that might be the track ID
                            for part in path_parts:
                                # Check for the 22-character Spotify track ID (base62 characters)
                                if len(part) == 22 and all(c in '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in part):
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

                        print(f"Fallback: Attempting to extract metadata for track ID: {track_id}", file=sys.stderr)
                        
                        # Basic web scraping approach
                        web_url = f'https://open.spotify.com/track/{track_id}'
                        response = self.session.get(web_url, timeout=15)
                        
                        if response.status_code == 200:
                            content = response.text
                            
                            # Fallback: Extract from page title
                            title_match = re.search(r'<title[^>]*>([^<]*)', content)
                            if title_match:
                                full_title = title_match.group(1)
                                # Remove ' - Spotify' suffix
                                clean_title = full_title.replace(' - Spotify', '').strip()

                                # Handle different title formats
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

                                result = {
                                    'id': track_id,
                                    'name': song_title,
                                    'artists': [{'name': artist_name}],
                                    'album': {'name': 'Unknown Album'},
                                    'duration_ms': 0,  # Unknown
                                    'external_urls': {'spotify': track_url},
                                    'preview_url': None
                                }
                                return result
                            else:
                                raise ValueError(f"Could not retrieve track info for ID: {track_id}")
                        else:
                            raise ValueError(f"Could not retrieve track info for ID: {track_id}")
                    except Exception as e:
                        print(f"Fallback extraction failed: {str(e)}", file=sys.stderr)
                        raise

                def close(self):
                    """Close the session"""
                    self.session.close()
                    
            return FallbackSpotifyClient()
        
        def get_track_info(self, track_url):
            """
            Get track info using spotify_scraper first, fall back to basic scraping if it fails
            """
            try:
                # Try with the main spotify_scraper package first
                return self.client.get_track_info(track_url)
            except Exception as e:
                print(f"Spotify scraper failed: {str(e)}, falling back to basic scraping", file=sys.stderr)
                # If that fails, use our fallback implementation
                return self.fallback_client.get_track_info(track_url)
        
        def close(self):
            """Close resources"""
            # For the external package, try to call close if available
            if hasattr(self.client, 'close'):
                self.client.close()
            if hasattr(self.fallback_client, 'close'):
                self.fallback_client.close()

except ImportError:
    # If import fails, use our fallback implementation
    print("Using local implementation due to missing spotify_scraper package", file=sys.stderr)
    
    import requests
    from urllib.parse import urlparse, parse_qs
    import os
    import re
    import json

    class SpotifyClient:
        def __init__(self):
            self.session = requests.Session()
            # Set a user agent to avoid being blocked
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            })

        def get_track_info(self, track_url):
            """
            Extract track information from a Spotify URL using basic web scraping
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
                elif len(path_parts) >= 1:
                    # Check any path part that might be the track ID
                    for part in path_parts:
                        # Check for the 22-character Spotify track ID (base62 characters)
                        if len(part) == 22 and all(c in '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' for c in part):
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

                print(f"Attempting to extract metadata for track ID: {track_id}", file=sys.stderr)
                
                # Basic web scraping approach
                web_url = f'https://open.spotify.com/track/{track_id}'
                response = self.session.get(web_url, timeout=15)
                
                if response.status_code == 200:
                    content = response.text
                    
                    # Fallback: Extract from page title
                    title_match = re.search(r'<title[^>]*>([^<]*)', content)
                    if title_match:
                        full_title = title_match.group(1)
                        # Remove ' - Spotify' suffix
                        clean_title = full_title.replace(' - Spotify', '').strip()

                        # Handle different title formats
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

                        result = {
                            'id': track_id,
                            'name': song_title,
                            'artists': [{'name': artist_name}],
                            'album': {'name': 'Unknown Album'},
                            'duration_ms': 0,  # Unknown
                            'external_urls': {'spotify': track_url},
                            'preview_url': None
                        }
                        return result
                    else:
                        raise ValueError(f"Could not retrieve track info for ID: {track_id}")
                else:
                    raise ValueError(f"Could not retrieve track info for ID: {track_id}")

            except Exception as e:
                print(f"Error extracting track info: {str(e)}", file=sys.stderr)
                raise

        def close(self):
            """Close the session"""
            self.session.close()