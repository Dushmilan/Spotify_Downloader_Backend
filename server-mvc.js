// server-mvc.js - MVC Server Implementation
const { app, port } = require('./src/app');

// Start the server
app.listen(port, () => {
  console.log(`MVC Server is running on http://localhost:${port}`);
  console.log('Routes:');
  console.log('  POST /download-spotify - Download a Spotify track by providing Spotify URL');
  console.log('  POST /validate-spotify - Validate a Spotify URL');
  console.log('  POST /download-youtube - Download audio directly from YouTube URL');
  console.log('  POST /validate-youtube - Validate a YouTube URL');
});

// Handle graceful shutdowns
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

module.exports = app;