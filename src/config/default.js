module.exports = {
  port: process.env.PORT || 3000,
  pythonPath: process.env.PYTHON_PATH || 'python',
  downloadsDir: process.env.DOWNLOADS_DIR || './downloads',
  logLevel: process.env.LOG_LEVEL || 'info',
  pythonScripts: {
    metadataExtractor: './spotify/metadata_extractor.py',
    youtubeDownloader: './yt-dlp/downloader.py'
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  }
};