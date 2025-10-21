const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Validates a Spotify URL by scraping the page
 * @param {string} url - The Spotify URL to validate
 * @returns {Promise<Object>} - Returns a promise indicating the validity and details
 */
async function validateSpotifyLink(url) {
    try {
        const response = await axios.get(url);

        // Check if the response status is OK
        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            const title = $('h1').text(); // Extract title
            let artist = ""; 

            // Extract artist name based on HTML structure
            if ($('a[data-testid="entity-name"]').length) {
                artist = $('a[data-testid="entity-name"]').text(); // Targeting the artist link
            } else if ($('span[data-testid="artist-name"]').length) {
                artist = $('span[data-testid="artist-name"]').text(); // Another structure check
            }

            if (title && artist) {
                return { valid: true, type: determineType(url), title, artist };
            }
        }
    } catch (error) {
        console.error('Error fetching the URL:', error.message);
    }

    return { valid: false, message: 'Resource not found on Spotify.' };
}

/**
 * Determines the type of the Spotify resource
 * @param {string} url - The Spotify URL
 * @returns {string} - Returns the type of resource (track, album, playlist, etc.)
 */
function determineType(url) {
    const type = url.split('/')[3];
    return type.charAt(0).toUpperCase() + type.slice(1); // Capitalize the type
}

// Example usage
const linksToTest = [
    'https://open.spotify.com/track/0m89ibOSeZNEtshbZ3w472?si=19bdfb8be4554939',
    'https://open.spotify.com/album/1A8QhvgdB8x7C06Z9bSblx',
    'https://open.spotify.com/playlist/37i9dQZF1DXcEbY8IQxV6P',
];

(async () => {
    for (const link of linksToTest) {
        const result = await validateSpotifyLink(link);
        console.log(`The link "${link}" is ${result.valid ? 'valid' : 'invalid'}. ${result.title ? `Title: ${result.title}` : result.message}${result.artist ? `, Artist: ${result.artist}` : ''}`);
    }
})();
