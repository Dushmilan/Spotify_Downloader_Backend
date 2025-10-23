const SpotifyMetadata = require('./src/models/SpotifyMetadata');

// Test the updated functionality
async function testMetadataExtraction() {
  try {
    // Using a sample Spotify track URL for testing
    const testUrl = "https://open.spotify.com/track/26dSoYcl0fuf2YKPKU5lzm"; // Example URL - "Shape of You" by Ed Sheeran
    
    console.log("Testing metadata extraction with YouTube URL...");
    const result = await SpotifyMetadata.extractMetadata(testUrl);
    
    console.log("Result received:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("\nMetadata extraction successful!");
      console.log(`Track: ${result.metadata.title}`);
      console.log(`Artist: ${result.metadata.artist}`);
      console.log(`YouTube URL: ${result.metadata.youtube_url || 'Not found'}`);
    } else {
      console.log(`\nError: ${result.error}`);
    }
  } catch (error) {
    console.error("Test failed with error:", error.message);
  }
}

testMetadataExtraction();