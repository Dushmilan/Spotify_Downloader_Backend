from spotify_scraper import SpotifyClient

# Initialize client
client = SpotifyClient()

# Get track data
track_url = "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6"
track = client.get_track_info(track_url)

# Display information
print(f"Track: {track.get('name', 'Unknown')}")
print(f"Artist: {', '.join(a['name'] for a in track['artists'])}")
print(f"Duration: {track.get('duration_ms', 0) / 1000:.1f} seconds")
print(f"Explicit: {'Yes' if track.get('is_explicit') else 'No'}")