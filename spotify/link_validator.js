// filename: spotifyMetaScraper.js
// Description: Extracts Spotify track metadata without Spotify API using network interception

import puppeteer from "puppeteer";

function validateSpotifyUrl(url) {
  const regex = /^https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[A-Za-z0-9]+(\?.*)?$/;
  return regex.test(url);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSpotifyMetadata(url) {
  if (!validateSpotifyUrl(url)) {
    throw new Error("Invalid Spotify URL format");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  let trackData = null;

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  page.on("response", async (response) => {
    const reqUrl = response.url();
    if (reqUrl.includes("spotify.com") && reqUrl.includes("graphql")) {
      try {
        const json = await response.json();
        const payload = JSON.stringify(json);
        if (payload.includes("trackUnion")) {
          trackData = json;
        }
      } catch {}
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(5000); // give Spotify time to fetch track data
    await browser.close();

    if (!trackData) throw new Error("No metadata found (GraphQL data not captured)");

    const trackUnion =
      trackData.data?.trackUnion || trackData.data?.track || null;

    if (!trackUnion) throw new Error("No track data in GraphQL payload");

    return {
      title: trackUnion.name || null,
      artist: trackUnion.artists?.items?.[0]?.profile?.name || null,
      album: trackUnion.albumOfTrack?.name || null,
      cover_url:
        trackUnion.albumOfTrack?.coverArt?.sources?.[0]?.url || null,
      duration:
        trackUnion.duration?.totalMilliseconds
          ? trackUnion.duration.totalMilliseconds / 1000
          : null,
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// Example usage
(async () => {
  const url = "https://open.spotify.com/track/2takcwOaAZWiXQijPHIx7B";
  try {
    const metadata = await getSpotifyMetadata(url);
    console.log(metadata);
  } catch (e) {
    console.error("Error:", e.message);
  }
})();

export { getSpotifyMetadata, validateSpotifyUrl };
