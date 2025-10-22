import yt_dlp
import os
import time

def download_audio(url, output_path):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
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
        result = ydl.download([url])
        return result

def search_and_download_track(track_name, artist_name, output_path):
    """Search for a track on alternative platforms and download it"""
    query = f"{track_name} {artist_name} audio official"
    # Use YouTube Music specifically instead of general YouTube to find official audio
    search_query = f"ytmsearch1:{query}"  # ytmsearch for YouTube Music
    
    # First, search and get the video info without downloading
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
        'postprocessor_args': [
            '-ar', '44100'
        ],
        'prefer_ffmpeg': True,
        'audioquality': '0',
        'extractaudio': True,
        'outtmpl': os.path.join(output_path, f"{track_name.replace('/', '_').replace(':', '_')} - {artist_name.replace('/', '_').replace(':', '_')}.%(ext)s"),
        'restrictfilenames': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            # Search for the track using YouTube Music
            result = ydl.extract_info(search_query, download=True)
            return result
        except Exception as e:
            print(f"Error downloading track from YouTube Music: {e}")
            
            # If YouTube Music fails, try other platforms
            try:
                alternative_search = f"scsearch1:{query}"  # SoundCloud search
                result = ydl.extract_info(alternative_search, download=True)
                return result
            except Exception as e2:
                print(f"Error downloading track from SoundCloud: {e2}")
                return None

def download_spotify_url(url, output_path):
    """Download audio from a Spotify URL directly if supported by yt-dlp"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
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
            result = ydl.download([url])
            return result
        except Exception as e:
            print(f"Direct Spotify download failed: {e}")
            # Fallback to search approach if direct download doesn't work
            print("Falling back to search approach...")
            # Extract possible track info from URL or search
            return None

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python downloader.py <url_or_trackname> <artistname> <output_path>")
        print("Or: python downloader.py <spotify_url> <output_path>")
        sys.exit(1)
    
    if len(sys.argv) == 4:  # Search for track using metadata
        track_name = sys.argv[1]
        artist_name = sys.argv[2]
        output_path = sys.argv[3]
        search_and_download_track(track_name, artist_name, output_path)
    elif len(sys.argv) == 3:  # Direct Spotify URL download
        url = sys.argv[1]
        output_path = sys.argv[2]
        
        # Check if it's a Spotify URL
        if "spotify.com" in url or "open.spotify.com" in url or url.startswith("spotify:"):
            download_spotify_url(url, output_path)
        else:
            # For other URLs, we could add more logic as needed
            download_audio(url, output_path)