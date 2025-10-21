const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Validates a Spotify URL by scraping the page
 * @param {string} url - The Spotify URL to validate.
 * @returns {Promise<Object>} - Returns a promise indicating the validity and details.
 */
async function validateSpotifyLink(url) {
    try {
        const response = await axios.get(url);

        // Check if the response status is OK
        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            const title = $('h1').text(); // Adjust based on the HTML structure of the Spotify page

            if (title) {
                return { valid: true, type: determineType(url), title };
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
 * @returns {string} - Returns the type of the resource (track, album, playlist, etc.)
 */
function determineType(url) {
    const type = url.split('/')[3];
    return type.charAt(0).toUpperCase() + type.slice(1); // Capitalize the type
}

module.exports = { validateSpotifyLink };
