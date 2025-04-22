const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Get JSON file path from command line argument
const jsonPath = process.argv[2];
// Get screenshots directory from command line argument
const screenshotsDir = process.argv[3] || path.join(__dirname, 'screenshots');
// Maximum concurrent processes
const MAX_CONCURRENT = 10;

if (!jsonPath) {
    console.error('Please provide a path to JSON file');
    console.error('Usage: node batch.js <path-to-json>');
    process.exit(1);
}

async function executeScreenshot(listing) {
    return new Promise((resolve, reject) => {
        const mainScriptPath = path.join(__dirname, 'main.js');
        exec(`node "${mainScriptPath}" "${listing.siteUrl}" "${screenshotsDir}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error processing ${listing.siteUrl}:`, error);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr for ${listing.siteUrl}:`, stderr);
            }
            console.log(stdout);
            resolve();
        });
    });
}

async function processInBatches(listings) {
    for (let i = 0; i < listings.length; i += MAX_CONCURRENT) {
        const batch = listings.slice(i, i + MAX_CONCURRENT);
        console.log(`Processing batch ${Math.floor(i/MAX_CONCURRENT) + 1}, items ${i + 1}-${i + batch.length}`);
        
        const promises = batch.map(listing => {
            if (!listing.siteUrl) {
                console.warn(`Skipping listing: No URL found`);
                return Promise.resolve();
            }
            return executeScreenshot(listing).catch(err => {
                console.error(`Failed to process ${listing.siteUrl}:`, err.message);
            });
        });

        await Promise.all(promises);
    }
}

async function processListingsFile(jsonFilePath) {
    try {
        // Create screenshots directory if it doesn't exist
        await fs.mkdir(screenshotsDir, { recursive: true });
        
        // Read and parse JSON file
        const jsonContent = await fs.readFile(path.resolve(jsonFilePath), 'utf8');
        const listings = JSON.parse(jsonContent);

        console.log(`Found ${listings.length} listings to process`);
        console.log(`Processing ${MAX_CONCURRENT} screenshots concurrently\n`);

        await processInBatches(listings);
        
        console.log('\nAll listings processed');

    } catch (err) {
        console.error('Error processing JSON file:', err.message);
        process.exit(1);
    }
}

// Run the process
processListingsFile(jsonPath);
