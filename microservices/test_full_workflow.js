const axios = require('axios');

// Test script for the complete workflow through the API Gateway
console.log('Testing Full Workflow via API Gateway...\n');

const API_GATEWAY_URL = 'http://localhost:3000';
// Using the sample track and playlist URLs provided
const SAMPLE_TRACK_URL = 'https://open.spotify.com/track/4t7zKQ4BiRxjnSwlFBL9G3?si=37c11342c9ee435b';
const SAMPLE_PLAYLIST_URL = 'https://open.spotify.com/playlist/6d7vltVjUg8cia1Htfw9QU?si=ff8b813ed1734b28';

async function testMetadataEndpoint() {
    console.log('1. Testing metadata endpoint via API Gateway...\n');
    
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/get-metadata`, {
            spotifyUrl: SAMPLE_TRACK_URL
        }, {
            timeout: 30000
        });
        
        console.log('✓ Metadata endpoint successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.TrackName && response.data.ArtistName) {
            console.log('✓ Response contains expected fields (TrackName, ArtistName)');
        } else {
            console.log('✗ Response missing expected fields');
        }
        
        return response.data; // Return for potential use in next tests
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure API Gateway is running on port 3000 and all services are available');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        return null;
    }
}

async function testSearchEndpoint() {
    console.log('\n' + '='.repeat(50));
    console.log('2. Testing YouTube URL search endpoint via API Gateway...\n');
    
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/get-youtube_url`, {
            TrackName: 'Rude',
            ArtistName: 'Magic!'
        }, {
            timeout: 30000
        });
        
        console.log('✓ YouTube URL search endpoint successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.youtubeUrl) {
            console.log('✓ Response contains expected field (youtubeUrl)');
            console.log('Found URL:', response.data.youtubeUrl);
        } else {
            console.log('✗ Response missing expected field (youtubeUrl)');
        }
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure API Gateway is running on port 3000 and all services are available');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        return null;
    }
}

async function testTrackDownloadEndpoint() {
    console.log('\n' + '='.repeat(50));
    console.log('3. Testing track download endpoint via API Gateway...\n');
    
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/download-track`, {
            spotifyUrl: SAMPLE_TRACK_URL
        }, {
            timeout: 120000 // 2 minute timeout
        });
        
        console.log('✓ Track download endpoint successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.message && response.data.path) {
            console.log('✓ Response contains expected fields (message, path)');
            console.log('Download path:', response.data.path);
        } else {
            console.log('✓ Request processed successfully');
        }
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure API Gateway is running on port 3000 and all services are available');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        console.log('Note: This test may take a while as it actually downloads the track');
        return null;
    }
}

async function testPlaylistDownloadEndpoint() {
    console.log('\n' + '='.repeat(50));
    console.log('4. Testing playlist download endpoint via API Gateway...\n');
    
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/download-playlist`, {
            spotifyUrl: SAMPLE_PLAYLIST_URL
        }, {
            timeout: 300000 // 5 minute timeout
        });
        
        console.log('✓ Playlist download endpoint successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.message) {
            console.log('✓ Response contains expected field (message)');
            console.log('Status:', response.data.message);
            
            if (response.data.successfulDownloads !== undefined && response.data.failedDownloads !== undefined) {
                console.log(`Successfully downloaded: ${response.data.successfulDownloads}`);
                console.log(`Failed downloads: ${response.data.failedDownloads}`);
            }
        } else {
            console.log('✓ Request processed successfully');
        }
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure API Gateway is running on port 3000 and all services are available');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        console.log('Note: This test may take a very long time as it processes an entire playlist');
        return null;
    }
}

async function testHealthCheck() {
    console.log('\n' + '='.repeat(50));
    console.log('5. Testing API Gateway health check...\n');
    
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/`);
        
        console.log('✓ API Gateway health check successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log(`✗ Health check failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure API Gateway is running on port 3000');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
        return null;
    }
}

async function runFullWorkflowTest() {
    console.log('Starting comprehensive full workflow test...\n');
    
    await testHealthCheck();
    await testMetadataEndpoint();
    await testSearchEndpoint();
    await testTrackDownloadEndpoint();
    await testPlaylistDownloadEndpoint();
    
    console.log('\n' + '='.repeat(70));
    console.log('Full Workflow Testing Complete');
    console.log('Remember: All services must be running for this test to work:');
    console.log('- API Gateway on http://localhost:3000');
    console.log('- Metadata Service on http://localhost:3001');
    console.log('- Search Service on http://localhost:3002');
    console.log('- Download Service on http://localhost:3003');
    console.log('');
    console.log('Start them with:');
    console.log('1. cd microservices/api-gateway && npm start');
    console.log('2. cd microservices/metadata-service && python app.py');
    console.log('3. cd microservices/search-service && python app.py');
    console.log('4. cd microservices/download-service && python app.py');
    console.log('='.repeat(70));
}

runFullWorkflowTest();