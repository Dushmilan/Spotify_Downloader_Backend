const validateSpotifyUrl = (req, res, next) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  // Basic validation for Spotify URL format
  try {
    const url = new URL(spotifyUrl);
    if (!url.hostname.includes('spotify.com') && !url.hostname.includes('open.spotify.com')) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  next();
};

const validateSpotifyPlaylistUrl = (req, res, next) => {
  const { spotifyUrl } = req.body;

  if (!spotifyUrl) {
    return res.status(400).json({ error: 'Spotify URL is required' });
  }

  // Validation for Spotify playlist URL format
  try {
    const url = new URL(spotifyUrl);
    if (!url.hostname.includes('spotify.com') && !url.hostname.includes('open.spotify.com')) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }
    
    if (!url.pathname.includes('playlist')) {
      return res.status(400).json({ error: 'URL is not a Spotify playlist' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  next();
};

module.exports = {
  validateSpotifyUrl,
  validateSpotifyPlaylistUrl
};