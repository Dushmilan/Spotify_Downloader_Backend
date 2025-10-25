from flask import Flask, request, jsonify
import subprocess
import sys
import os
import json
from urllib.parse import urlparse

app = Flask(__name__)

# Configuration
PYTHON_PATH = os.getenv('PYTHON_PATH', 'python')

@app.route('/metadata', methods=['POST'])
def get_metadata():
    try:
        data = request.json
        spotify_url = data.get('spotifyUrl')

        if not spotify_url:
            return jsonify({'error': 'Spotify URL is required'}), 400

        # Validate Spotify URL format
        try:
            url = urlparse(spotify_url)
            if 'spotify.com' not in url.hostname and 'open.spotify.com' not in url.hostname:
                return jsonify({'error': 'Invalid Spotify URL format'}), 400
        except Exception:
            return jsonify({'error': 'Invalid URL format'}), 400

        # Execute the Python script to extract metadata
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'spotify_metadata.py')
        
        result = subprocess.run([PYTHON_PATH, script_path, spotify_url], 
                                capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"Error executing Python script: {result.stderr}")
            return jsonify({'error': 'Failed to extract metadata', 'details': result.stderr}), 500

        if result.stderr:
            print(f"Python script stderr: {result.stderr}")
            try:
                error_result = json.loads(result.stderr.strip())
                return jsonify({'error': error_result.get('error', f'Metadata script error: {result.stderr}')}), 500
            except json.JSONDecodeError:
                return jsonify({'error': f'Non-JSON metadata script error: {result.stderr}'}), 500

        try:
            output = result.stdout.strip()
            json_start = output.find('{')
            json_end = output.rfind('}')
            
            if json_start != -1 and json_end != -1 and json_end >= json_start:
                json_string = output[json_start:json_end + 1]
                result_data = json.loads(json_string)

                if not result_data['metadata'].get('title') or not result_data['metadata'].get('artist'):
                    return jsonify({'error': 'Extracted metadata missing title or artist'}), 500

                return jsonify({
                    'TrackName': result_data['metadata']['title'],
                    'ArtistName': result_data['metadata']['artist'],
                })
            else:
                result_data = json.loads(output)
                if not result_data['metadata'].get('title') or not result_data['metadata'].get('artist'):
                    return jsonify({'error': 'Extracted metadata missing title or artist'}), 500
                
                return jsonify({
                    'TrackName': result_data['metadata']['title'],
                    'ArtistName': result_data['metadata']['artist'],
                })
        except json.JSONDecodeError:
            print(f"Error parsing Python output: {result.stdout}")
            return jsonify({'error': f'Failed to parse metadata: {result.stdout}'}), 500
        except KeyError as e:
            print(f"Key error: {e}")
            return jsonify({'error': f'Missing key in metadata: {e}'}), 500

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Metadata extraction timed out'}), 500
    except Exception as e:
        print(f"Error in get_metadata: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'message': 'Metadata Service is running', 'endpoint': '/metadata'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)