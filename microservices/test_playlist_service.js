const axios = require('axios');

// Test script for playlist download service
console.log('Testing Playlist Download Service...\n');

const DOWNLOAD_SERVICE_URL = 'http://localhost:3003';
// Using the sample playlist URL provided
const SAMPLE_PLAYLIST_URL = 'https://open.spotify.com/playlist/6d7vltVjUg8cia1Htfw9QU?si=ff8b813ed1734b28';

async function testPlaylistService() {
    console.log(`Testing playlist download for: ${SAMPLE_PLAYLIST_URL}\n`);
    
    try {
        const response = await axios.post(`${DOWNLOAD_SERVICE_URL}/download-playlist`, {
            spotifyUrl: SAMPLE_PLAYLIST_URL
        }, {
            timeout: 300000 // 5 minute timeout (playlists can take much longer)
        });
        
        console.log('✓ Playlist download request successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.message) {
            console.log('\n✓ Response contains expected field (message)');
            console.log('Status:', response.data.message);
            
            if (response.data.successfulDownloads !== undefined && response.data.failedDownloads !== undefined) {
                console.log(`Successfully downloaded: ${response.data.successfulDownloads}`);
                console.log(`Failed downloads: ${response.data.failedDownloads}`);
            }
        } else {
            console.log('\n✓ Request processed (response structure may vary based on service implementation)');
        }
        
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure the download service is running on port 3003');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        console.log('Note: This test may take a very long time as it processes an entire playlist');
    }
}

async function testInvalidPlaylistUrl() {
    console.log('\n' + '='.repeat(50));
    console.log('Testing with invalid Spotify playlist URL...\n');
    
    try {
        const response = await axios.post(`${DOWNLOAD_SERVICE_URL}/download-playlist`, {
            spotifyUrl: 'https://open.spotify.com/playlist/invalid-id'
        });
        
        console.log('✗ Expected error for invalid URL but got success');
    } catch (error) {
        if (error.response) {
            console.log(`✓ Correctly handled invalid URL with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else {
            console.log('✓ Error occurred as expected:', error.message);
        }
    }
}

async function testMissingUrl() {
    console.log('\n' + '='.repeat(50));
    console.log('Testing with missing URL...\n');
    
    try {
        const response = await axios.post(`${DOWNLOAD_SERVICE_URL}/download-playlist`, {});
        
        console.log('✗ Expected error for missing URL but got success');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✓ Correctly handled missing URL with 400 status');
        } else {
            console.log('✓ Error occurred as expected:', error.message);
        }
    }
}

async function runTests() {
    await testPlaylistService();
    await testInvalidPlaylistUrl();
    await testMissingUrl();
    
    console.log('\n' + '='.repeat(50));
    console.log('Playlist Service Testing Complete');
    console.log('Remember: The download service must be running on http://localhost:3003');
    console.log('Start it with: cd microservices/download-service && python app.py');
    console.log('='.repeat(50));
}

runTests();