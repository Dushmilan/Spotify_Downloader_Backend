const axios = require('axios');

// Test script for metadata service
console.log('Testing Metadata Service...\n');

const METADATA_SERVICE_URL = 'http://localhost:3001';
const SAMPLE_TRACK_URL = 'https://open.spotify.com/track/4t7zKQ4BiRxjnSwlFBL9G3?si=37c11342c9ee435b';

async function testMetadataService() {
    console.log(`Testing metadata extraction for: ${SAMPLE_TRACK_URL}\n`);
    
    try {
        const response = await axios.post(`${METADATA_SERVICE_URL}/metadata`, {
            spotifyUrl: SAMPLE_TRACK_URL
        }, {
            timeout: 30000 // 30 second timeout
        });
        
        console.log('✓ Metadata extraction successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Validate response structure
        if (response.data.TrackName && response.data.ArtistName) {
            console.log('\n✓ Response contains expected fields (TrackName, ArtistName)');
        } else {
            console.log('\n✗ Response missing expected fields');
        }
        
    } catch (error) {
        if (error.response) {
            console.log(`✗ Request failed with status: ${error.response.status}`);
            console.log('Error response:', error.response.data);
        } else if (error.request) {
            console.log('✗ No response received. Make sure the metadata service is running on port 3001');
        } else {
            console.log(`✗ Error: ${error.message}`);
        }
    }
}

async function testInvalidUrl() {
    console.log('\n' + '='.repeat(50));
    console.log('Testing with invalid URL...\n');
    
    try {
        const response = await axios.post(`${METADATA_SERVICE_URL}/metadata`, {
            spotifyUrl: 'https://invalid-url.com'
        });
        
        console.log('✗ Expected error for invalid URL but got success');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✓ Correctly handled invalid URL with 400 status');
        } else {
            console.log('✓ Error occurred as expected:', error.message);
        }
    }
}

async function runTests() {
    await testMetadataService();
    await testInvalidUrl();
    
    console.log('\n' + '='.repeat(50));
    console.log('Metadata Service Testing Complete');
    console.log('Remember: The metadata service must be running on http://localhost:3001');
    console.log('Start it with: cd microservices/metadata-service && python app.py');
    console.log('='.repeat(50));
}

runTests();