const YouTubeService = require('./src/services/YouTubeService');
const fs = require('fs');
const path = require('path');

async function testDirectYouTubeDownload() {
    console.log('Testing direct YouTube download functionality...');
    
    // A sample YouTube URL for testing - using a public domain video
    const youtubeUrl = 'https://www.youtube.com/watch?v=J---aiyznGQ'; // Keyboard Cat video
    
    try {
        console.log('Attempting to download directly from YouTube URL...');
        const downloadResult = await YouTubeService.downloadFromYouTubeUrl(youtubeUrl);
        
        if (downloadResult.success) {
            console.log('Direct download completed successfully!');
            console.log('File path:', downloadResult.filePath);
            console.log('File name:', downloadResult.fileName);
            
            // Check if the file actually exists in the downloads directory
            const fullFilePath = path.join(__dirname, downloadResult.filePath);
            const fileExists = fs.existsSync(fullFilePath);
            console.log('File exists on disk:', fileExists);
            
            if (fileExists) {
                const fileSize = fs.statSync(fullFilePath).size;
                console.log('File size:', fileSize, 'bytes');
                console.log('Success! Direct YouTube download is working.');
            } else {
                console.log('ERROR: File was reported as downloaded but does not exist on disk.');
            }
        } else {
            console.log('Direct download failed:', downloadResult.error);
        }
    } catch (error) {
        console.error('Error in direct YouTube download:', error.message);
    }
}

// Run the test
testDirectYouTubeDownload();