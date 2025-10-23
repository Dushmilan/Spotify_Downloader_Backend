import sys
import json
import yt_dlp

def search_youtube_for_track(track_title, artist_name):
    """
    Search YouTube for a track using yt-dlp and return the best match URL
    
    Args:
        track_title (str): The title of the track
        artist_name (str): The name of the artist
        
    Returns:
        str: YouTube URL of the best match, or None if not found
    """
    try:
        # Construct search query
        search_query = f"ytsearch1:{track_title} {artist_name}"
       
        # Use yt-dlp to search for the track
        ydl_opts = {
            'quiet': True,  # Reduce output
            'extract_flat': True,  # Only extract metadata without download
            'no_warnings': True,  # Suppress warnings
        }
       
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(search_query, download=False)
           
            if result and 'entries' in result and result['entries']:
                # Get the first (best) match
                entry = result['entries'][0]
                video_id = entry.get('id')
                if video_id:
                    return f"https://www.youtube.com/watch?v={video_id}"
   
    except Exception as e:
        # Log the error but don't break the main functionality
        print(f"Error searching YouTube: {str(e)}", file=sys.stderr)
        return None
   
    return None



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