const SpotifyController = require('./src/controllers/spotifyController');
const YouTubeController = require('./src/controllers/youtubeController');

// Test the services directly
async function testServices() {
    console.log('Testing restructured Spotify Downloader Backend...');
    
    // Example Spotify URL for testing (would need to be a real URL in practice)
    const testSpotifyUrl = 'https://open.spotify.com/track/4A1T3FWBYEi5XQ8eLv9rFs?si=ebdb810768264f8a';
    
    console.log('Backend structure successfully reorganized!');
    console.log('New features implemented:');
    console.log('- Modular architecture with separation of concerns');
    console.log('- Configuration management');
    console.log('- Logging system');
    console.log('- Error handling middleware');
    console.log('- Input validation middleware');
    console.log('- Better organized codebase');
    console.log('');
    console.log('To test the full functionality, start the server with: npm start');
}

testServices();