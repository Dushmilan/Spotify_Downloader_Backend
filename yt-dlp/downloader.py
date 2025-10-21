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
    """Search for a track on YouTube and download it"""
    query = f"{track_name} {artist_name} audio official"
    search_query = f"ytsearch1:{query}"
    
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
            # Search for the track
            result = ydl.extract_info(search_query, download=True)
            return result
        except Exception as e:
            print(f"Error downloading track: {e}")
            return None

def download_youtube_url(url, output_path):
    """Download audio from a direct YouTube URL"""
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

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python downloader.py <url_or_trackname> <artistname> <output_path>")
        print("Or: python downloader.py <youtube_url> <output_path>")
        sys.exit(1)
    
    if len(sys.argv) == 4:  # Search for track
        track_name = sys.argv[1]
        artist_name = sys.argv[2]
        output_path = sys.argv[3]
        search_and_download_track(track_name, artist_name, output_path)
    elif len(sys.argv) == 3:  # Direct YouTube download
        url = sys.argv[1]
        output_path = sys.argv[2]
        download_youtube_url(url, output_path)