import sys
import json
import subprocess

def get_complete_metadata(spotify_url):
    """
    Get both Spotify metadata and YouTube URL for a Spotify track
    """
    try:
        # First, get Spotify metadata by running the module as a script
        result = subprocess.run([sys.executable, 'spotify/spotify_metadata.py', spotify_url], 
                                capture_output=True, text=True)
        
        if result.returncode != 0:
            # Handle error from spotify metadata extraction
            error_result = json.loads(result.stdout) if result.stdout else {'success': False, 'error': 'Failed to extract Spotify metadata'}
            print(json.dumps(error_result))
            sys.exit(1)  # Exit with error code since subprocess already had an error
        
        # Parse the Spotify result
        spotify_result = json.loads(result.stdout)
        
        if not spotify_result.get('success'):
            print(json.dumps(spotify_result))
            sys.exit(1)  # Exit with error code
        
        # Get the metadata from the Spotify result
        metadata = spotify_result.get('metadata', {})
        
        # Search for YouTube URL using the metadata by running the module as a script
        youtube_result = search_youtube_for_track(metadata.get('title', ''), metadata.get('artist', ''))
        
        if youtube_result and youtube_result.get('success'):
            # Combine the results
            combined_result = {
                'success': True,
                'metadata': {
                    **metadata,
                    'youtube_url': youtube_result.get('youtube_url')
                }
            }
        else:
            # Even if YouTube search fails, return Spotify metadata
            combined_result = {
                'success': True,
                'metadata': {
                    **metadata,
                    'youtube_url': youtube_result.get('youtube_url') if youtube_result else None
                }
            }
        
        print(json.dumps(combined_result))
        return combined_result
        
    except Exception as e:
        result = {
            'success': False,
            'error': f'Error combining metadata: {str(e)}'
        }
        print(json.dumps(result))
        sys.exit(1)

def search_youtube_for_track(track_title, artist_name):
    """
    Helper function to run youtube_search as a subprocess
    """
    try:
        result = subprocess.run([sys.executable, 'spotify/youtube_search.py', track_title, artist_name], 
                                capture_output=True, text=True)
        
        if result.stdout:
            return json.loads(result.stdout)
        else:
            return {'success': True, 'youtube_url': None}  # Return None if no result
    except Exception as e:
        print(f"Error in search_youtube_for_track: {str(e)}", file=sys.stderr)
        return {'success': False, 'youtube_url': None}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'No Spotify URL provided'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    spotify_url = sys.argv[1]
    get_complete_metadata(spotify_url)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'No Spotify URL provided'
        }
        print(json.dumps(result))
        sys.exit(1)
    
    spotify_url = sys.argv[1]
    get_complete_metadata(spotify_url)