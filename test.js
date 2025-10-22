const { spawn } = require('child_process');
const path = require('path');

// Test the Python scripts directly with new structure
async function testPythonScripts() {
    console.log('Testing Python scripts with new structure...');

    // Test metadata extraction
    console.log('\n1. Testing metadata extraction:');
    const metadataProcess = spawn('py', [
        path.join(__dirname, 'python', 'spotify', 'metadata_extractor.py'),
        'https://open.spotify.com/track/4A1T3FWBYEi5XQ8eLv9rFs?si=ebdb810768264f8a'
    ]);

    metadataProcess.stdout.on('data', (data) => {
        console.log(`Metadata output: ${data}`);
    });

    metadataProcess.stderr.on('data', (data) => {
        console.error(`Metadata error: ${data}`);
    });

    metadataProcess.on('close', (code) => {
        console.log(`Metadata script exited with code ${code}`);
        
        if (code === 0) {
            // Test yt-dlp download
            console.log('\n2. Testing YouTube download:');
            const downloadProcess = spawn('py', [
                path.join(__dirname, 'python', 'downloader', 'youtube_downloader.py'),
                'Shape of You',  // Example track name
                'Ed Sheeran',    // Example artist name
                path.join(__dirname, 'downloads')
            ]);

            downloadProcess.stdout.on('data', (data) => {
                console.log(`Download output: ${data}`);
            });

            downloadProcess.stderr.on('data', (data) => {
                console.error(`Download error: ${data}`);
            });

            downloadProcess.on('close', (code) => {
                console.log(`Download script exited with code ${code}`);
            });
        }
    });
}

testPythonScripts();