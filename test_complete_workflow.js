const SpotifyService = require('./src/services/SpotifyService');
const YouTubeService = require('./src/services/YouTubeService');
const fs = require('fs');
const path = require('path');

async function testCompleteWorkflow() {
    console.log('Starting complete workflow test...');
    
    // Sample Spotify URL for testing
    const spotifyUrl = 'https://open.spotify.com/track/5iv6lZAIguXWYW4Zaz5zvY?si=4b159eba28434ae2';
    
    try {
        console.log('\n1. Extracting metadata from Spotify URL...');
        const metadata = await SpotifyService.extractMetadata(spotifyUrl);
        console.log('Metadata extracted successfully:', metadata);
        
        console.log('\n2. Downloading audio from YouTube based on metadata...');
        const downloadResult = await YouTubeService.downloadFromYouTube(metadata);
        
        if (downloadResult.success) {
            console.log('Download completed successfully!');
            console.log('File path:', downloadResult.filePath);
            console.log('File name:', downloadResult.fileName);
            
            // Check if the file actually exists in the downloads directory
            const fullFilePath = path.join(__dirname, downloadResult.filePath);
            const fileExists = fs.existsSync(fullFilePath);
            console.log('File exists on disk:', fileExists);
            
            if (fileExists) {
                const fileSize = fs.statSync(fullFilePath).size;
                console.log('File size:', fileSize, 'bytes');
                console.log('Success! The complete workflow is working correctly.');
            } else {
                console.log('ERROR: File was reported as downloaded but does not exist on disk.');
            }
        } else {
            console.log('Download failed:', downloadResult.error);
        }
    } catch (error) {
        console.error('Error in workflow:', error.message);
    }
}

// Run the test
testCompleteWorkflow();