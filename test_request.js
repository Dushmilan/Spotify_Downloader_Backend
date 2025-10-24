const axios = require('axios');

// Test the downloadPlaylist endpoint
async function testDownloadPlaylist() {
  try {
    console.log('Testing downloadPlaylist endpoint...');
    
    const response = await axios.post('http://localhost:3000/download-playlist', {
      spotifyUrl: 'https://open.spotify.com/playlist/7cifluiYWoLCcdeQvtvWP0?si=2SA9mtNwTDuNvTySaCsR_Q'
    });
    
    console.log('Response received:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error making request:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testDownloadPlaylist();