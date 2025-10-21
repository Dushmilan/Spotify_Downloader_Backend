const validator = require('validator');

/**
 * Validates a Spotify URL
 * @param {string} url - The Spotify URL to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateSpotifyLink(url) {
    const spotifyUrlRegex = /^(https?:\/\/)?(www\.)?(spotify\.com)\/(track|album|playlist|artist)\/[a-zA-Z0-9]+(.*)?$/;

    return validator.isURL(url) && spotifyUrlRegex.test(url);
}

// Example usage:
const linksToTest = [
    'https://open.spotify.com/track/7ouMYWpqST9nE1HpVW1S8k',
    'https://open.spotify.com/album/1A8QhvgdB8x7C06Z9bSblx',
    'https://open.spotify.com/playlist/37i9dQZF1DXcEbY8IQxV6P',
    'https://open.spotify.com/artist/1234567890',
    'https://invalidspotify.com/track/xyz',
];

linksToTest.forEach(link => {
    const isValid = validateSpotifyLink(link);
    console.log(`The link "${link}" is ${isValid ? 'valid' : 'invalid'}.`);
});
module.exports = {
    validateSpotifyLink,
};