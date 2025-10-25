from flask import Flask, request, jsonify
import subprocess
import sys
import os
import json

app = Flask(__name__)

# Configuration
PYTHON_PATH = os.getenv('PYTHON_PATH', 'python')

@app.route('/youtube-url', methods=['POST'])
def get_youtube_url():
    try:
        data = request.json
        track_name = data.get('TrackName')
        artist_name = data.get('ArtistName')

        if not track_name or not artist_name:
            return jsonify({'error': 'TrackName and ArtistName are required'}), 400

        # Execute the Python script to fetch YouTube URL
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'spotify', 'fetch_youtube_url.py')
        
        result = subprocess.run([PYTHON_PATH, script_path, track_name, artist_name], 
                                capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error executing Python script: {result.stderr}")
            return jsonify({'error': 'Failed to fetch YouTube URL'}), 500

        if result.stderr:
            print(f"Python script stderr: {result.stderr}")
            try:
                error_result = json.loads(result.stderr.strip())
                return jsonify({'error': error_result.get('error', 'Error occurred during YouTube URL fetching')}), 500
            except json.JSONDecodeError:
                return jsonify({'error': 'Error occurred during YouTube URL fetching'}), 500

        try:
            output = result.stdout.strip()
            result_data = json.loads(output)
            return jsonify({'youtubeUrl': result_data['youtube_url']})
        except json.JSONDecodeError:
            print(f"Error parsing Python output: {result.stdout}")
            return jsonify({'error': 'Failed to parse YouTube URL'}), 500

    except Exception as e:
        print(f"Error in get_youtube_url: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'message': 'Search Service is running', 'endpoint': '/youtube-url'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002, debug=True)