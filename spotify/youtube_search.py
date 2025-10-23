import sys
import json
import yt_dlp

def search_youtube_for_track(track_title, artist_name):
    """
    Search YouTube for a track using yt-dlp and return the best match URL
    """
    try:
        # Construct search query
        search_query = f"{track_title} {artist_name}"
        
        # Use yt-dlp to search for the track
        ydl_opts = {
            'format': 'best',
            'default_search': 'ytsearch1',  # Search for 1 video
            'quiet': True,  # Reduce output
            'extract_flat': True,  # Only extract metadata without download
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(search_query, download=False)
            
            if result and 'entries' in result and result['entries']:
                # Get the first (best) match
                entry = result['entries'][0]
                return entry.get('webpage_url', None)
    
    except Exception as e:
        # Log the error but don't break the main functionality
        print(f"Error searching YouTube: {str(e)}", file=sys.stderr)
        return None
    
    return None

def search_youtube_for_metadata(metadata):
    """
    Search YouTube for a track using metadata from the Spotify metadata extraction
    """
    try:
        title = metadata.get('title', '')
        artist = metadata.get('artist', '')
        
        youtube_url = search_youtube_for_track(title, artist)
        
        result = {
            'success': True,
            'youtube_url': youtube_url,
            'search_query': f"{title} {artist}"
        }
        
        print(json.dumps(result))
        return result
        
    except Exception as e:
        result = {
            'success': False,
            'error': f'Error during YouTube search: {str(e)}'
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        result = {
            'success': False,
            'error': 'No track title and artist provided'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    track_title = sys.argv[1]
    artist_name = sys.argv[2]
    
    youtube_url = search_youtube_for_track(track_title, artist_name)
    
    result = {
        'success': True,
        'youtube_url': youtube_url,
        'search_query': f"{track_title} {artist_name}"
    }
    
    print(json.dumps(result))