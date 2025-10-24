const { exec } = require('child_process');
const path = require('path');

// Test the Python playlist script directly
function testPythonScript() {
    console.log('Testing Python playlist script...');
    
    const pythonScript = path.join(__dirname, 'spotify', 'spotify_playlist.py');
    // Using a sample playlist URL for testing
    const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; // This is a public playlist
    
    const command = `python "${pythonScript}" "${testUrl}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Python script stderr: ${stderr}`);
            return;
        }

        console.log('Python script stdout:', stdout);
        
        try {
            const result = JSON.parse(stdout);
            if (result.success) {
                console.log('✅ Python script test successful!');
                console.log(`Playlist: ${result.playlist.name}`);
                console.log(`Owner: ${result.playlist.owner}`);
                console.log(`Track count: ${result.playlist.track_count}`);
                console.log(`First track: ${result.playlist.tracks[0]?.title} by ${result.playlist.tracks[0]?.artist}`);
            } else {
                console.log('❌ Python script test failed:', result.error);
            }
        } catch (parseError) {
            console.error('Error parsing Python output:', parseError.message);
        }
    });
}

// Test the Node.js model
async function testNodeModel() {
    console.log('\nTesting Node.js model...');
    
    const SpotifyMetadata = require('./src/models/SpotifyMetadata');
    
    // Test with a sample playlist URL
    const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
    
    try {
        const result = await SpotifyMetadata.extractPlaylistMetadata(testUrl);
        console.log('✅ Node.js model test successful!');
        console.log('Playlist Name:', result.playlistName);
        console.log('Playlist Owner:', result.playlistOwner);
        console.log('Track Count:', result.trackCount);
        if (result.tracks && result.tracks.length > 0) {
            console.log('First Track:', result.tracks[0].title, 'by', result.tracks[0].artist);
        }
    } catch (error) {
        console.log('❌ Node.js model test failed:', error.message);
    }
}

// Run tests
console.log('Starting playlist functionality tests...\n');
testPythonScript();
// Note: The Node.js test will take some time to complete, so we'll run it separately if needed

console.log('\nNote: To fully test the Node.js model, run:');
console.log('node -e "require(\'./test_playlist.js\').testNodeModel()"');