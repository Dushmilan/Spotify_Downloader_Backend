from flask import Flask, request, jsonify
import subprocess
import sys
import os
import json
import tempfile
from urllib.parse import urlparse
import pathlib

app = Flask(__name__)

# Configuration
PYTHON_PATH = os.getenv('PYTHON_PATH', 'python')

def is_valid_spotify_url(url):
    try:
        parsed = urlparse(url)
        return 'spotify.com' in parsed.hostname or 'open.spotify.com' in parsed.hostname
    except:
        return False

@app.route('/download-track', methods=['POST'])
def download_track():
    try:
        data = request.json
        spotify_url = data.get('spotifyUrl')

        if not spotify_url:
            return jsonify({'error': 'Spotify URL is required'}), 400

        if not is_valid_spotify_url(spotify_url):
            return jsonify({'error': 'Invalid Spotify URL format'}), 400

        # Execute Python script to extract metadata
        metadata_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'spotify_metadata.py')
        
        metadata_result = subprocess.run([PYTHON_PATH, metadata_script_path, spotify_url], 
                                         capture_output=True, text=True)
        
        if metadata_result.returncode != 0:
            print(f"Error executing metadata script: {metadata_result.stderr}")
            return jsonify({'error': f'Failed to extract metadata: {metadata_result.stderr}'}), 500

        if metadata_result.stderr and 'error' in metadata_result.stderr.lower():
            print(f"Metadata script stderr: {metadata_result.stderr}")
            return jsonify({'error': f'Metadata script error: {metadata_result.stderr}'}), 500

        try:
            metadata_output = metadata_result.stdout.strip()
            json_start = metadata_output.find('{')
            json_end = metadata_output.rfind('}')
            
            if json_start != -1 and json_end != -1 and json_end >= json_start:
                json_string = metadata_output[json_start:json_end + 1]
                metadata_data = json.loads(json_string)
            else:
                metadata_data = json.loads(metadata_output)
        except json.JSONDecodeError:
            print(f"Error parsing metadata output: {metadata_result.stdout}")
            return jsonify({'error': f'Failed to parse metadata: {metadata_result.stdout}'}), 500

        if not metadata_data.get('metadata', {}).get('title') or not metadata_data.get('metadata', {}).get('artist'):
            return jsonify({'error': 'Failed to extract track and artist name from metadata'}), 500

        # Execute Python script to fetch YouTube URL
        search_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'fetch_youtube_url.py')
        
        search_result = subprocess.run([PYTHON_PATH, search_script_path, 
                                        metadata_data['metadata']['title'], 
                                        metadata_data['metadata']['artist']], 
                                       capture_output=True, text=True)
        
        if search_result.returncode != 0:
            print(f"Error executing YouTube search script: {search_result.stderr}")
            return jsonify({'error': f'Failed to fetch YouTube URL: {search_result.stderr}'}), 500

        if search_result.stderr and 'error' in search_result.stderr.lower():
            print(f"YouTube search script stderr: {search_result.stderr}")
            return jsonify({'error': f'YouTube search script error: {search_result.stderr}'}), 500

        try:
            search_output = search_result.stdout.strip()
            search_data = json.loads(search_output)
        except json.JSONDecodeError:
            print(f"Error parsing YouTube URL output: {search_result.stdout}")
            return jsonify({'error': f'Failed to parse YouTube URL: {search_result.stdout}'}), 500

        if not search_data.get('youtube_url'):
            return jsonify({'error': 'Could not find YouTube URL for the track'}), 500

        # Execute Python script to download the track
        download_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'youtube', 'youtube_downloader.py')
        output_path = f"downloads/{metadata_data['metadata']['title']} - {metadata_data['metadata']['artist']}.mp3"
        
        download_result = subprocess.run([PYTHON_PATH, download_script_path, search_data['youtube_url'], output_path], 
                                         capture_output=True, text=True)
        
        if download_result.returncode != 0:
            print(f"Error executing download script: {download_result.stderr}")
            return jsonify({'error': f'Failed to download track: {download_result.stderr}'}), 500

        if download_result.stderr:
            print(f"Download script stderr: {download_result.stderr}")
            return jsonify({'error': f'Download script error: {download_result.stderr}'}), 500

        print(f"Download script output: {download_result.stdout}")
        
        return jsonify({'message': 'Track downloaded successfully', 'path': output_path})

    except Exception as e:
        print(f"Error in download_track: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/download-playlist', methods=['POST'])
def download_playlist():
    try:
        data = request.json
        spotify_url = data.get('spotifyUrl')

        if not spotify_url:
            return jsonify({'error': 'Spotify URL is required'}), 400

        if not is_valid_spotify_url(spotify_url):
            return jsonify({'error': 'Invalid Spotify URL format'}), 400

        # Execute Python script to extract playlist metadata
        playlist_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'spotify_playlist.py')
        
        playlist_result = subprocess.run([PYTHON_PATH, playlist_script_path, spotify_url], 
                                         capture_output=True, text=True)
        
        if playlist_result.returncode != 0:
            print(f"Error executing playlist script: {playlist_result.stderr}")
            return jsonify({'error': f'Failed to extract playlist metadata: {playlist_result.stderr}'}), 500

        if playlist_result.stderr and 'error' in playlist_result.stderr.lower():
            print(f"Playlist script stderr: {playlist_result.stderr}")
            return jsonify({'error': f'Playlist script error: {playlist_result.stderr}'}), 500

        try:
            playlist_output = playlist_result.stdout.strip()
            json_start = playlist_output.find('{')
            json_end = playlist_output.rfind('}')
            
            if json_start != -1 and json_end != -1 and json_end >= json_start:
                json_string = playlist_output[json_start:json_end + 1]
                playlist_data = json.loads(json_string)
            else:
                playlist_data = json.loads(playlist_output)
                
            if not playlist_data.get('success'):
                error_msg = playlist_data.get('error', 'Playlist metadata extraction failed')
                return jsonify({'error': error_msg}), 500
        except json.JSONDecodeError:
            print(f"Error parsing playlist output: {playlist_result.stdout}")
            return jsonify({'error': f'Failed to parse playlist metadata: {playlist_result.stdout}'}), 500

        if (not playlist_data.get('playlist') or 
            not playlist_data['playlist'].get('name') or 
            not playlist_data['playlist'].get('tracks') or 
            len(playlist_data['playlist']['tracks']) == 0):
            return jsonify({'error': 'Failed to extract playlist data or playlist is empty'}), 500

        # Create a directory for the playlist
        import re
        playlist_name = playlist_data['playlist']['name']
        # Sanitize directory name by removing invalid characters for Windows
        sanitized_name = re.sub(r'[<>:"/\\|?*]', '_', playlist_name)
        playlist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'downloads', sanitized_name)
        
        os.makedirs(playlist_dir, exist_ok=True)

        # Save playlist info
        import json as json_module
        playlist_info_path = os.path.join(playlist_dir, 'playlist_info.json')
        playlist_info = {
            'name': playlist_data['playlist']['name'],
            'owner': playlist_data['playlist']['owner'],
            'trackCount': playlist_data['playlist']['track_count'],
            'url': spotify_url,
            'tracks': [
                {
                    'title': track['title'],
                    'artist': track['artist'],
                    'album': track['album'],
                    'duration_ms': track['duration_ms']
                } 
                for track in playlist_data['playlist']['tracks']
            ]
        }
        
        with open(playlist_info_path, 'w', encoding='utf-8') as f:
            json_module.dump(playlist_info, f, indent=2)

        # Download each track in the playlist
        successful_downloads = []
        failed_downloads = []

        for i, track in enumerate(playlist_data['playlist']['tracks']):
            if track.get('title') and track.get('artist'):
                # Execute Python script to fetch YouTube URL for the track
                search_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'fetch_youtube_url.py')
                
                search_result = subprocess.run([PYTHON_PATH, search_script_path, track['title'], track['artist']], 
                                               capture_output=True, text=True)
                
                if search_result.returncode != 0:
                    print(f"Error executing YouTube search script for {track['title']}: {search_result.stderr}")
                    failed_downloads.append({
                        'track': f"{track['title']} by {track['artist']}", 
                        'status': 'failed', 
                        'error': search_result.stderr
                    })
                    continue

                if search_result.stderr:
                    print(f"YouTube search script stderr for {track['title']}: {search_result.stderr}")
                    failed_downloads.append({
                        'track': f"{track['title']} by {track['artist']}", 
                        'status': 'failed', 
                        'error': search_result.stderr
                    })
                    continue

                try:
                    search_output = search_result.stdout.strip()
                    search_data = json.loads(search_output)
                    
                    if search_data.get('youtube_url'):
                        # Create a filename with track number, title and artist
                        track_number = str(i + 1).zfill(2)  # Pad with leading zero
                        file_name = f"{track_number} - {track['title']} - {track['artist']}.mp3"
                        output_path = os.path.join(playlist_dir, file_name)
                        
                        # Execute Python script to download the track
                        download_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'youtube', 'youtube_downloader.py')
                        
                        download_result = subprocess.run([PYTHON_PATH, download_script_path, search_data['youtube_url'], output_path], 
                                                         capture_output=True, text=True)
                        
                        if download_result.returncode != 0:
                            print(f"Error downloading track {track['title']}: {download_result.stderr}")
                            failed_downloads.append({
                                'track': f"{track['title']} by {track['artist']}", 
                                'status': 'failed', 
                                'error': download_result.stderr
                            })
                        elif download_result.stderr:
                            print(f"Download script stderr for {track['title']}: {download_result.stderr}")
                            failed_downloads.append({
                                'track': f"{track['title']} by {track['artist']}", 
                                'status': 'failed', 
                                'error': download_result.stderr
                            })
                        else:
                            print(f"Download script output for {track['title']}: {download_result.stdout}")
                            successful_downloads.append({
                                'track': f"{track['title']} by {track['artist']}", 
                                'status': 'success', 
                                'path': output_path
                            })
                    else:
                        failed_downloads.append({
                            'track': f"{track['title']} by {track['artist']}", 
                            'status': 'failed', 
                            'error': 'Could not find YouTube URL'
                        })
                except json.JSONDecodeError:
                    print(f"Error parsing YouTube URL output for {track['title']}: {search_result.stdout}")
                    failed_downloads.append({
                        'track': f"{track['title']} by {track['artist']}", 
                        'status': 'failed', 
                        'error': f"Failed to parse YouTube URL: {search_result.stdout}"
                    })

        return jsonify({ 
            'message': f'Playlist download completed. {len(successful_downloads)} tracks downloaded successfully, {len(failed_downloads)} tracks failed.',
            'playlistName': playlist_data['playlist']['name'],
            'totalTracks': playlist_data['playlist']['track_count'],
            'successfulDownloads': len(successful_downloads),
            'failedDownloads': len(failed_downloads),
            'directory': playlist_dir,
            'details': successful_downloads + failed_downloads
        })

    except Exception as e:
        print(f"Error in download_playlist: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'message': 'Download Service is running', 'endpoints': ['/download-track', '/download-playlist']})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3003, debug=True)