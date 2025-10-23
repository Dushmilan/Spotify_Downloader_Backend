import sys
import json
import subprocess

def get_complete_metadata(spotify_url):
    """
    Get both Spotify metadata and YouTube URL for a Spotify track
    """
    try:
        # First, get Spotify metadata by running the module as a script
        import os
        import re
        script_path = os.path.join(os.path.dirname(__file__), 'spotify_metadata.py')
        result = subprocess.run([sys.executable, script_path, spotify_url], 
                                capture_output=True, text=True)
        
        if result.returncode != 0:
            # Handle error from spotify metadata extraction
            # Try to extract JSON from mixed output (in case of logging mixed with JSON)
            output = result.stdout
            if output:
                # Find JSON object in the output
                json_match = re.search(r'\{.*\}', output, re.DOTALL)
                if json_match:
                    try:
                        error_result = json.loads(json_match.group())
                        print(json.dumps(error_result))
                        sys.exit(1)  # Exit with error code since subprocess already had an error
                    except json.JSONDecodeError:
                        pass
            
            error_result = {'success': False, 'error': 'Failed to extract Spotify metadata'}
            print(json.dumps(error_result))
            sys.exit(1)  # Exit with error code since subprocess already had an error
        
        # Parse the Spotify result
        # Handle potential mixed logging output with JSON
        import re
        output = result.stdout
        # Find JSON object in the output
        json_match = re.search(r'\{.*\}', output, re.DOTALL)
        if json_match:
            try:
                spotify_result = json.loads(json_match.group())
            except json.JSONDecodeError:
                result_obj = {
                    'success': False,
                    'error': 'Failed to parse Spotify metadata response'
                }
                print(json.dumps(result_obj))
                sys.exit(1)
        else:
            result_obj = {
                'success': False,
                'error': 'No valid JSON response from Spotify metadata extraction'
            }
            print(json.dumps(result_obj))
            sys.exit(1)
        
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
        import os
        script_path = os.path.join(os.path.dirname(__file__), 'youtube_search.py')
        result = subprocess.run([sys.executable, script_path, track_title, artist_name], 
                                capture_output=True, text=True)
        
        if result.stdout:
            import re
            # Find JSON object in the output
            json_match = re.search(r'\{.*\}', result.stdout, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            return {'success': True, 'youtube_url': None}  # Return None if JSON parsing fails
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