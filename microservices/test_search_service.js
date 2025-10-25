const axios = require('axios');

// Test script for search service
console.log('Testing Search Service...\n');

const SEARCH_SERVICE_URL = 'http://localhost:3002';
const SAMPLE_TRACK_NAME = 'Rude';
const SAMPLE_ARTIST_NAME = 'Magic!';

async function testSearchService() {
    console.log(`Testing YouTube URL search for: "${SAMPLE_TRACK_NAME}" by "${SAMPLE_ARTIST_NAME}"\n`);
    
    try {
        const response = await axios.post(`${SEARCH_SERVICE_URL}/youtube-url`, {
            TrackName: SAMPLE_TRACK_NAME,
            ArtistName: SAMPLE_ARTIST_NAME
        }, {
            timeout: 30000 // 30 second timeout
        });
        
        console.log('✓ YouTube URL search successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.youtubeUrl) {
            console.log('\n✓ Response contains expected field (youtubeUrl)');
            console.log('Found URL:', response.data.youtubeUrl);
        } else {
            console.log('\n✗ Response missing expected field (youtubeUrl)');
        }
        
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure the search service is running on port 3002');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
    }
}

async function testInvalidRequest() {
    console.log('\n' + '='.repeat(50));
    console.log('Testing with missing parameters...\n');
    
    try {
        const response = await axios.post(`${SEARCH_SERVICE_URL}/youtube-url`, {
            TrackName: SAMPLE_TRACK_NAME
            // Missing ArtistName
        });
        
        console.log('✗ Expected error for missing parameters but got success');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✓ Correctly handled missing parameters with 400 status');
        } else {
            console.log('✓ Error occurred as expected:', error.message);
        }
    }
}

async function runTests() {
    await testSearchService();
    await testInvalidRequest();
    
    console.log('\n' + '='.repeat(50));
    console.log('Search Service Testing Complete');
    console.log('Remember: The search service must be running on http://localhost:3002');
    console.log('Start it with: cd microservices/search-service && python app.py');
    console.log('='.repeat(50));
}

runTests();