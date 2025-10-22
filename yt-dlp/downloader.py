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
    import urllib.request
    import urllib.parse
    
    # Clean up the track name and artist name to make better search queries
    # Remove extra text that might be in the metadata
    clean_track_name = re.sub(r'\s*-\s*song and lyrics.*', '', track_name, flags=re.IGNORECASE)
    clean_track_name = re.sub(r'\s*-\s*from.*', '', clean_track_name, flags=re.IGNORECASE)
    clean_artist_name = re.sub(r'\(.*remix.*\)|\[.*remix.*\]', '', artist_name, flags=re.IGNORECASE).strip()
    clean_track_name = re.sub(r'\(.*remix.*\)|\[.*remix.*\]', '', clean_track_name, flags=re.IGNORECASE).strip()
    
    # Create multiple search queries in order of preference - emphasize artist name to improve results
    search_queries = [
        f"{clean_artist_name} {clean_track_name} official audio",  # Artist first
        f"{clean_artist_name} {clean_track_name} official music video",  # Artist first
        f"{clean_artist_name} - {clean_track_name} official",  # Artist - Track format
        f"{clean_artist_name} {clean_track_name} audio",  # Artist first
        f"{clean_track_name} {clean_artist_name} official audio",  # Track-artist format
        f"{clean_track_name} {clean_artist_name} audio",  # Track-artist format
        f"{clean_artist_name} {clean_track_name}",  # Basic artist track
        f"{clean_track_name} {clean_artist_name}",  # Basic track artist
    ]
    
    print(f"Searching YouTube for queries: {search_queries}", file=sys.stderr)  # Log the search queries
    
    # First, try to find the video using YouTube with yt-dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'extract_flat': True,  # Only extract info, don't download
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        'match_filter': lambda info, *, incomplete: None,  # Don't filter anything
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for query in search_queries:
            try:
                search_query = f"ytsearch5:{query}"  # Search for 5 results to have more options
                print(f"Trying YouTube search: {search_query}", file=sys.stderr)  # Log the search
                result = ydl.extract_info(search_query, download=False)
                if result and 'entries' in result and result['entries']:
                    print(f"Found {len(result['entries'])} results for query: {query}", file=sys.stderr)  # Log results
                    # Filter and sort results to find the best match
                    best_match = find_best_match(result['entries'], clean_track_name, clean_artist_name)
                    if best_match:
                        print(f"Best match found: {best_match.get('title', 'Unknown')} - {best_match.get('webpage_url', 'No URL')}", file=sys.stderr)  # Log best match
                        return best_match
            except Exception as e:
                print(f"Error searching on YouTube with query '{query}': {e}", file=sys.stderr)
                continue  # Try the next query
        
        # If YouTube search fails, try other platforms
        print("Trying SoundCloud search as fallback...", file=sys.stderr)  # Log fallback
        for query in search_queries:
            try:
                alternative_search = f"scsearch1:{query}"  # SoundCloud search
                result = ydl.extract_info(alternative_search, download=False)
                if result and 'entries' in result and result['entries']:
                    entry = result['entries'][0]
                    print(f"SoundCloud fallback result: {entry.get('title', 'Unknown')} - {entry.get('webpage_url', 'No URL')}", file=sys.stderr)  # Log fallback result
                    return entry
            except Exception as e2:
                print(f"Error searching on SoundCloud with query '{query}': {e2}", file=sys.stderr)
                continue  # Try the next query
        
        print("No results found on any platform", file=sys.stderr)  # Log no results
        return None

def find_best_match(entries, track_name, artist_name):
    """Find the best matching entry from search results based on title similarity"""
    import difflib
    
    # Normalize the target track name and artist for comparison
    target_title = f"{artist_name} {track_name}".lower().strip()
    
    best_match = None
    best_score = 0.0
    
    for entry in entries:
        # Get the title and uploader to compare
        entry_title = entry.get('title', '').lower()
        entry_uploader = entry.get('uploader', '').lower()
        
        # Calculate similarity score for the title
        title_similarity = difflib.SequenceMatcher(None, entry_title, target_title).ratio()
        
        # Bonus for official channels or well-known uploaders
        upload_bonus = 0
        if any(keyword in entry_uploader for keyword in ['official', 'vevo', artist_name.lower()]):
            upload_bonus = 0.1  # 10% bonus for official content
        
        # Calculate final score
        final_score = title_similarity + upload_bonus
        
        # Check if this entry is a better match
        if final_score > best_score:
            best_score = final_score
            best_match = entry
    
    # Only return the match if it has a decent similarity score (at least 30% similar)
    if best_score >= 0.3:
        return best_match
    
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
    """Download audio from the given URL to the specified output path using yt-dlp Python API"""
    import time
    
    # Validate inputs
    if not url or not output_path:
        print("URL and output path are required", file=sys.stderr)
        return False
    
    print(f"Starting download from URL: {url}", file=sys.stderr)  # Log the URL being downloaded
    
    # Ensure the downloads directory exists
    downloads_dir = os.path.dirname(output_path)
    if not os.path.exists(downloads_dir):
        os.makedirs(downloads_dir, exist_ok=True)
    
    # Multiple configuration approaches with more advanced options for YouTube
    configs = [
        # Config 1: Basic setup with extractor args to bypass restrictions
        {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'postprocessor_args': [
                '-ar', '44100'
            ],
            'prefer_ffmpeg': True,
            'audioquality': '0',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': output_path + '.%(ext)s',
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
            },
            'sleep_interval_requests': 1,
            'sleep_interval': 1,
            'max_sleep_interval': 3,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web'],
                    'skip': ['dash', 'hls'],
                }
            },
            'cookiefile': None,  # Could use cookies if available
        },
        # Config 2: Different approach with specific format
        {
            'format': 'bestaudio[ext=m4a]/bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'postprocessor_args': [
                '-ar', '44100'
            ],
            'prefer_ffmpeg': True,
            'audioquality': '0',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': output_path + '.%(ext)s',
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/',
                'Connection': 'keep-alive',
            },
            'sleep_interval_requests': 1,
            'sleep_interval': 2,
            'max_sleep_interval': 5,
            'extractor_args': {
                'youtube': {
                    'player_client': ['web'],
                }
            },
        },
        # Config 3: Yet another approach with different options
        {
            'format': 'best[height<=720][width<=1280]/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'postprocessor_args': [
                '-ar', '44100'
            ],
            'prefer_ffmpeg': True,
            'audioquality': '0',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': output_path + '.%(ext)s',
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/',
                'Connection': 'keep-alive',
            },
            'sleep_interval_requests': 1,
            'sleep_interval': 3,
            'max_sleep_interval': 7,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android_creator', 'web_embedded'],
                }
            },
        }
    ]
    
    for i, config in enumerate(configs):
        try:
            print(f"Trying download config {i+1}...", file=sys.stderr)
            with yt_dlp.YoutubeDL(config) as ydl:
                ydl.download([url])
            
            print("Download completed successfully", file=sys.stderr)
            # Check if the file was actually created and rename it to .mp3
            import glob
            # Look for the downloaded file with any extension
            possible_files = glob.glob(output_path + '.*')
            if possible_files:
                downloaded_file = possible_files[0]
                # Rename to have .mp3 extension
                final_path = output_path + '.mp3'
                os.rename(downloaded_file, final_path)
                print(f"Renamed {downloaded_file} to {final_path}", file=sys.stderr)
            return True
            
        except Exception as e:
            print(f"Config {i+1} failed: {e}", file=sys.stderr)
            
            # Wait before trying the next approach
            if i < len(configs) - 1:
                time.sleep(3)
    
    # If all configs failed, return False to indicate failure
    print("All download configs failed", file=sys.stderr)
    return False

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Usage: python downloader.py <url_or_trackname> [artist_name] or python downloader.py download <url> <output_path>'}), file=sys.stderr)
        sys.exit(1)
    
    try:
        # Handle the case where arguments may have been split due to spaces
        # Try to intelligently reconstruct the arguments based on expected patterns
        
        if sys.argv[1] == 'download' and len(sys.argv) >= 3:
            # The download command expects: script.py download url output_path
            # Find where the URL ends and output path begins
            # Since output_path is typically a path, we can look for that
            for i in range(2, len(sys.argv)):
                arg = sys.argv[i]
                if arg.startswith('/') or arg.startswith('./') or ':' in arg or 'C:' in arg or 'D:' in arg:
                    # This looks like a file path - reconstruct the URL from args 2 to i-1
                    url = ' '.join(sys.argv[2:i])
                    output_path = ' '.join(sys.argv[i:])
                    break
            else:
                # If no path found, assume the last arg is the output path
                url = sys.argv[2]
                output_path = sys.argv[3] if len(sys.argv) > 3 else sys.argv[2]
            
            success = download_audio(url, output_path)
            if success:
                print(json.dumps({'success': True, 'message': 'Download completed successfully'}))
            else:
                print(json.dumps({'success': False, 'error': 'Download failed'}), file=sys.stderr)
                sys.exit(1)
        elif len(sys.argv) >= 3:  # Search for track using metadata
            # Arguments might have been split due to spaces in track names
            # The last argument is most likely to be the path (if any), so let's assume the last argument is the path
            # and work backward to reconstruct track name and artist
            
            args = sys.argv[1:]  # Skip script name
            
            # Check if the last argument looks like a path
            if (len(args) >= 3 and 
                (args[-1].startswith('/') or args[-1].startswith('./') or ':' in args[-1] or 'C:' in args[-1] or 'D:' in args[-1])):
                # This is probably the downloads directory - reconstruct title and artist from the first parts
                downloads_dir = args[-1]
                remaining_args = args[:-1]
                
                # For "track_name artist_name" pattern, we could try different splits
                # but for now, let's just join the remaining args as the track name and use a default artist
                # Actually, for metadata search, we expect exactly track_name and artist_name
                if len(remaining_args) >= 2:
                    track_name = remaining_args[0]
                    artist_name = remaining_args[1]
                else:
                    track_name = remaining_args[0] if remaining_args else "Unknown"
                    artist_name = "Unknown"
            else:
                # Just title and artist (or malformed)
                if len(args) >= 2:
                    track_name = args[0]  # First part
                    artist_name = args[1]  # Second part
                    # If there are more parts due to spaces, we need to reconstruct
                    if len(args) > 2:
                        # Assume everything after the first space belongs to the track name
                        # Actually, let's try multiple approaches to determine the split
                        track_name = args[0]
                        artist_name = args[1]
                        # If there are more arguments, we need to figure out whether they belong to track name or artist name
                        # For now, a simple approach - last of the extra arguments is artist, rest join to track name
                        if len(args) > 2:
                            # For a more sophisticated approach, we could try to detect where the artist name starts
                            # But for now, joining remaining arguments to artist_name as a simple solution
                            artist_name = ' '.join(args[1:])
                else:
                    track_name = args[0] if args else "Unknown"
                    artist_name = "Unknown"
            
            # Validate inputs
            if not track_name or not artist_name:
                print(json.dumps({'success': False, 'error': 'Track name and artist name are required'}), file=sys.stderr)
                sys.exit(1)
                
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
            
            # Validate URL
            if not url:
                print(json.dumps({'success': False, 'error': 'URL is required'}), file=sys.stderr)
                sys.exit(1)
            
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
        else:
            print(json.dumps({'success': False, 'error': 'Invalid arguments'}), file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'success': False, 'error': f'Unexpected error: {str(e)}'}), file=sys.stderr)
        sys.exit(1)