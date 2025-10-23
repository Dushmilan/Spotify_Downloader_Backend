const { exec } = require('child_process');
const path = require('path');

// Test the complete workflow with Node.js
console.log("Testing complete workflow from Node.js to Python and back");
console.log("============================================================");

// Execute the combined metadata Python script through the Node.js model
const pythonScript = path.join(__dirname, 'spotify', 'combined_metadata.py');
const testSpotifyUrl = 'https://open.spotify.com/track/1JDZ0c0OzuyJjSwENJQg4n?si=0b3f037b9a244cca'; // Working track

console.log(`Executing: python "${pythonScript}" "${testSpotifyUrl}"`);

const child = exec(`python "${pythonScript}" "${testSpotifyUrl}"`, (error, stdout, stderr) => {
    console.log(`Return code: ${error ? error.code : 0}`);
    console.log(`Stdout: ${stdout}`);
    console.log(`Stderr: ${stderr}`);
    
    if (stdout) {
        try {
            const result = JSON.parse(stdout);
            console.log("\nParsed JSON Response:");
            console.log(JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log("\n✅ SUCCESS: Complete workflow is functioning!");
                console.log(`Track: ${result.metadata.title}`);
                console.log(`Artist: ${result.metadata.artist}`);
                console.log(`Album: ${result.metadata.album}`);
                console.log(`Duration: ${result.metadata.duration_s}s`);
                console.log(`YouTube URL: ${result.metadata.youtube_url || 'Not found'}`);
                console.log(`Total fields in metadata: ${Object.keys(result.metadata).length}`);
                
                // Verify that youtube_url field exists
                if ('youtube_url' in result.metadata) {
                    console.log("✅ YouTube URL field successfully integrated!");
                } else {
                    console.log("❌ YouTube URL field missing");
                }
            } else {
                console.log(`❌ Failed to get metadata: ${result.error}`);
            }
        } catch (e) {
            console.log(`❌ Error parsing JSON: ${e.message}`);
        }
    } else {
        console.log("❌ No output received");
    }
});