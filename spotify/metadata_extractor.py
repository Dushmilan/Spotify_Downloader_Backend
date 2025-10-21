from spotify_scraper import SpotifyClient

# Initialize the client
client = SpotifyClient()

# Extract track information
track_url = "https://open.spotify.com/track/4A1T3FWBYEi5XQ8eLv9rFs?si=ebdb810768264f8a"
track = client.get_track_info(track_url)

print(f"Track: {track.get('name', 'Unknown')}")
print(f"Artist: {(track.get('artists', [{}])[0].get('name', 'Unknown') if track.get('artists') else 'Unknown')}")
print(f"Duration: {track.get('duration_ms', 0) / 1000:.0f} seconds")

# Always close when done
client.close()