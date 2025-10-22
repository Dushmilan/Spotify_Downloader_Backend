import yt_dlp
import os
import time
import json
import re
import sys

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

def download_audio(url, output_path):
    """Download audio from the given URL to the specified output path using direct yt-dlp command"""
    import subprocess
    import os
    import time
    
    # Ensure the downloads directory exists
    downloads_dir = os.path.dirname(output_path)
    if not os.path.exists(downloads_dir):
        os.makedirs(downloads_dir, exist_ok=True)
    
    # Extract the base path without extension for use in yt-dlp
    base_path = output_path.replace('.%(ext)s', '')
    
    # Multiple command approaches
    commands = [
        # Command 1: Basic audio extraction
        [
            'yt-dlp',
            '-x', '--audio-format', 'mp3', '--audio-quality', '192k',
            '--output', f'{base_path}.%(ext)s',
            '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            url
        ],
        # Command 2: Different format selection
        [
            'yt-dlp',
            '-f', 'bestaudio/best',
            '-x', '--audio-format', 'mp3', '--audio-quality', '192k',
            '--output', f'{base_path}.%(ext)s',
            '--add-header', 'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            url
        ],
        # Command 3: With different headers and format
        [
            'yt-dlp',
            '-f', 'best[height<=720]/best',
            '-x', '--audio-format', 'mp3', '--audio-quality', '192k',
            '--output', f'{base_path}.%(ext)s',
            '--add-header', 'User-Agent:Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            url
        ]
    ]
    
    for i, cmd in enumerate(commands):
        try:
            print(f"Trying download command {i+1}...", file=sys.stderr)
            
            # Execute the yt-dlp command directly
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode == 0:
                print("Download completed successfully", file=sys.stderr)
                
                # Find the downloaded file with the correct extension
                import glob
                downloaded_files = glob.glob(f"{base_path}.*")
                
                # Look for the MP3 file
                mp3_file = None
                for file in downloaded_files:
                    if file.lower().endswith('.mp3'):
                        mp3_file = file
                        break
                
                if mp3_file:
                    print(f"Successfully downloaded: {mp3_file}", file=sys.stderr)
                    return True
                else:
                    print(f"Download process completed but MP3 file not found in: {downloaded_files}", file=sys.stderr)
                    return False
            else:
                print(f"Command {i+1} failed with return code {result.returncode}", file=sys.stderr)
                print(f"Error output: {result.stderr}", file=sys.stderr)
                
        except subprocess.TimeoutExpired:
            print(f"Command {i+1} timed out", file=sys.stderr)
        except Exception as e:
            print(f"Command {i+1} failed with exception: {e}", file=sys.stderr)
        
        # Wait before trying the next approach
        if i < len(commands) - 1:
            time.sleep(3)
    
    return False

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python downloader.py <url_or_trackname> [artist_name] or python downloader.py download <url> <output_path>")
        sys.exit(1)
    
    if sys.argv[1] == 'download' and len(sys.argv) == 4:  # Download audio
        _, cmd, url, output_path = sys.argv
        success = download_audio(url, output_path)
        if success:
            print(json.dumps({'success': True, 'message': 'Download completed successfully'}))
        else:
            print(json.dumps({'success': False, 'error': 'Download failed'}), file=sys.stderr)
            sys.exit(1)
    elif len(sys.argv) == 3:  # Search for track using metadata
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