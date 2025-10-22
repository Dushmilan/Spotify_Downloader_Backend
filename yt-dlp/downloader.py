import yt_dlp
import os
import time
import json
import re

def extract_audio_info(url):
    """Extract audio information without downloading"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,  # Only extract info, don't download
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'en-US,en;q=0.8',
        },
        'sleep_interval': 1,
        'max_sleep_interval': 3,
        'force_ipv4': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            result = ydl.extract_info(url, download=False)
            return result
        except Exception as e:
            print(f"Error extracting info: {e}", file=sys.stderr)
            return None

def search_and_extract_audio(track_name, artist_name):
    """Search for a track on alternative platforms and return audio info"""
    # Clean up the track name and artist name to make better search queries
    
    # Remove extra text that might be in the metadata
    clean_track_name = re.sub(r'\s*-\s*song and lyrics.*$', '', track_name, flags=re.IGNORECASE)
    clean_track_name = re.sub(r'\s*-\s*from.*$', '', clean_track_name, flags=re.IGNORECASE)
    clean_artist_name = artist_name
    
    # Create multiple search queries in order of preference
    search_queries = [
        f"{clean_track_name} {clean_artist_name} official audio",
        f"{clean_track_name} {clean_artist_name} audio",
        f"{clean_artist_name} {clean_track_name} official",
        f"{clean_track_name} {clean_artist_name}",
    ]
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,  # Only extract info, don't download
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for query in search_queries:
            try:
                search_query = f"ytsearch1:{query}"
                result = ydl.extract_info(search_query, download=False)
                if result and 'entries' in result and result['entries']:
                    # Return the first entry
                    return result['entries'][0]
            except Exception as e:
                print(f"Error searching on YouTube with query '{query}': {e}", file=sys.stderr)
                continue  # Try the next query
        
        # If YouTube search fails, try other platforms
        for query in search_queries:
            try:
                alternative_search = f"scsearch1:{query}"  # SoundCloud search
                result = ydl.extract_info(alternative_search, download=False)
                if result and 'entries' in result and result['entries']:
                    # Return the first entry
                    return result['entries'][0]
            except Exception as e2:
                print(f"Error searching on SoundCloud with query '{query}': {e2}", file=sys.stderr)
                continue  # Try the next query
        
        return None

def extract_spotify_url_info(url):
    """Extract audio info from a Spotify URL if supported by yt-dlp"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,  # Only extract info, don't download
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'en-US,en;q=0.8',
        },
        'sleep_interval': 1,
        'max_sleep_interval': 3,
        'force_ipv4': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            result = ydl.extract_info(url, download=False)
            return result
        except Exception as e:
            print(f"Spotify URL info extraction failed: {e}", file=sys.stderr)
            # Fallback to search approach if direct extraction doesn't work
            return None

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python downloader.py <url_or_trackname> [artist_name]")
        sys.exit(1)
    
    if len(sys.argv) == 3:  # Search for track using metadata
        track_name = sys.argv[1]
        artist_name = sys.argv[2]
        result = search_and_extract_audio(track_name, artist_name)
        
        if result:
            print(json.dumps({
                'success': True,
                'title': result.get('title', ''),
                'url': result.get('url', ''),
                'duration': result.get('duration'),
                'uploader': result.get('uploader', ''),
                'webpage_url': result.get('webpage_url', ''),
                'formats': result.get('formats', [])
            }))
        else:
            print(json.dumps({'success': False, 'error': 'Could not find audio'}), file=sys.stderr)
            sys.exit(1)
            
    elif len(sys.argv) == 2:  # Extract info from URL
        url = sys.argv[1]
        
        # Check if it's a Spotify URL
        if "spotify.com" in url or "open.spotify.com" in url or url.startswith("spotify:"):
            result = extract_spotify_url_info(url)
        else:
            # For other URLs, extract info directly
            result = extract_audio_info(url)
        
        if result:
            # Handle both single entries and search results
            if 'entries' in result and result['entries']:
                entry = result['entries'][0]
                print(json.dumps({
                    'success': True,
                    'title': entry.get('title', ''),
                    'url': entry.get('url', ''),
                    'duration': entry.get('duration'),
                    'uploader': entry.get('uploader', ''),
                    'webpage_url': entry.get('webpage_url', ''),
                    'formats': entry.get('formats', [])
                }))
            else:
                print(json.dumps({
                    'success': True,
                    'title': result.get('title', ''),
                    'url': result.get('url', ''),
                    'duration': result.get('duration'),
                    'uploader': result.get('uploader', ''),
                    'webpage_url': result.get('webpage_url', ''),
                    'formats': result.get('formats', [])
                }))
        else:
            print(json.dumps({'success': False, 'error': 'Could not extract audio info'}), file=sys.stderr)
            sys.exit(1)