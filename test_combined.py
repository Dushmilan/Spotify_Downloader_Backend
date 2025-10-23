import json

# Test data to simulate Spotify metadata
test_spotify_metadata = {
    "success": True,
    "metadata": {
        "title": "Video Games",
        "artist": "Lana Del Rey",
        "album": "Born to Die",
        "duration_ms": 295080,
        "duration_s": 295.08,
        "release_date": "2012-01-27",
        "track_id": "23x6WgYKq918Y60YzY3jNS",
        "track_url": "https://open.spotify.com/track/23x6WgYKq918Y60YzY3jNS",
        "preview_url": "https://p.scdn.co/mp3-preview/...",
        "external_urls": {
            "spotify": "https://open.spotify.com/track/23x6WgYKq918Y60YzY3jNS"
        },
        "available_markets": [
            "US",
            "CA"
        ],
        "disc_number": 1,
        "track_number": 4,
        "popularity": 72,
        "explicit": False,
        "isrc": "GBARL1101792",
        "label": "Interscope Records",
        "copyrights": [
            {
                "text": "2012 Interscope Records",
                "type": "C"
            }
        ],
        "artists": [
            {
                "name": "Lana Del Rey",
                "id": "4dZuZI98FBZ4cLtMGqK4cc",
                "external_urls": {
                    "spotify": "https://open.spotify.com/artist/4dZuZI98FBZ4cLtMGqK4cc"
                }
            }
        ]
    }
}

# Simulate getting YouTube URL
youtube_url = "https://www.youtube.com/watch?v=K-lPbSbGC0o"  # Example URL

# Combine the results
combined_result = {
    "success": True,
    "metadata": {
        **test_spotify_metadata["metadata"],
        "youtube_url": youtube_url
    }
}

print(json.dumps(combined_result))