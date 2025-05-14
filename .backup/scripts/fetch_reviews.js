/**
 * fetch_reviews.js
 *
 * Reads every place_id from combined_filtered_hvac.csv,
 * calls the Apify Google‑Maps reviews scraper (no limit),
 * and writes all reviews to reviews_all.csv.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const pLimit = require('p-limit');
const { createObjectCsvWriter } = require('csv-writer');

const CSV_INPUT_PATH  = path.resolve(__dirname, 'combined_filtered_hvac.csv');
const CSV_OUTPUT_PATH = path.resolve(__dirname, 'reviews_all.csv');
const APIFY_TOKEN     = 'apify_api_HZceYJ4kjPoaIyeQb98O8TEYfVqX1w1dOvaq';
const API_URL         = 'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items';
const CONCURRENCY     = 5;
const limit = pLimit(CONCURRENCY);

function loadPlaceIds() {
  return new Promise((resolve, reject) => {
    const ids = new Set();
    fs.createReadStream(CSV_INPUT_PATH)
      .pipe(csv())
      .on('data', row => {
        const pid = (row.place_id || '').trim();
        if (pid) ids.add(pid);
      })
      .on('end', () => resolve([...ids]))
      .on('error', reject);
  });
}

async function fetchReviews(placeId) {
  const url = `${API_URL}?token=${APIFY_TOKEN}`;
  const payload = {
    placeId,
    language: 'en',
    proxyConfiguration: { useApifyProxy: true }
  };
  const resp = await axios.post(url, payload, { timeout: 300_000 });
  return resp.data.map(r => ({ place_id: placeId, ...r }));
}

(async () => {
  console.log('Loading place IDs…');
  const placeIds = await loadPlaceIds();
  console.log(`→ Found ${placeIds.length} place IDs`);

  const allReviews = [];
  let done = 0;

  await Promise.all(
    placeIds.map(pid =>
      limit(async () => {
        try {
          const revs = await fetchReviews(pid);
          allReviews.push(...revs);
          console.log(`✔ ${pid}: ${revs.length} reviews`);
        } catch (err) {
          console.error(`✖ ${pid}: ${err.message}`);
        } finally {
          done++;
          process.stdout.write(`Progress: ${done}/${placeIds.length}\r`);
        }
      })
    )
  );

  if (!allReviews.length) {
    console.log('\nNo reviews fetched. Exiting.');
    process.exit(1);
  }

  console.log(`\nWriting ${allReviews.length} reviews to ${CSV_OUTPUT_PATH}…`);
  const header = Object.keys(allReviews[0]);
  const writer = createObjectCsvWriter({
    path: CSV_OUTPUT_PATH,
    header: header.map(h => ({ id: h, title: h }))
  });
  await writer.writeRecords(allReviews);
  console.log('✅ Done');
})();
