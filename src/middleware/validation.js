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

module.exports = {
  validateSpotifyUrl
};