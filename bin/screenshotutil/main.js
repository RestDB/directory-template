const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const targetUrl = process.argv[2];
const screenshotsDir = process.argv[3] || path.join(__dirname, 'screenshots');

(async () => {
    if (!targetUrl) {
        console.error('Please provide a URL as an argument');
        process.exit(1);
    }

    await fs.mkdir(screenshotsDir, { recursive: true });
    const filename = `${new URL(targetUrl).hostname.replace(/\W+/g, '_')}.png`;
    const filePath = path.join(screenshotsDir, filename);

    // Check if file already exists
    try {
        await fs.access(filePath);
        console.log(`✓ Screenshot already exists: ${filePath}`);
        process.exit(0);
    } catch (error) {
        // File doesn't exist, continue with screenshot
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Set default timeout for all operations
        page.setDefaultTimeout(60000);

        // Navigate with more reliable wait condition
        const response = await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Wait for the page to be relatively stable
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
            console.log('Network did not become fully idle, continuing anyway');
        });

        if (!response || response.status() >= 400) {
            throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        // Attempt to dismiss cookie banners (with Playwright auto-waiting)
        const selectors = [
            'button >> text=agree',
            'button >> text=allow',
            'button >> text=Allow all',
            'button >> text=Allow all cookies',
            'button >> text=accept',
            'button >> text=aksepter',
            'button >> text=godkjenn',
            'button >> text=godta',
            'button >> text=tillat',
            'button >> text=avvis',
            'button >> text=i agree',
            'button >> text=i accept',
            '[data-action-type="consent"]',
            '[aria-label*="cookie" i]',
            '[aria-label*="cookies" i]',
            '[aria-label*="cookie consent" i]',
            '[aria-label*="cookie preferences" i]',
            '[aria-label*="cookie settings" i]',
        ];
        let cookieBannerFound = false;
        for (const sel of selectors) {
            try {
                const element = await page.$(sel);
                if (element) {
                    console.log(`Found cookie banner element with selector: ${sel}`);
                    await page.click(sel);
                    await page.waitForTimeout(1000);
                    cookieBannerFound = true;
                    break;
                }
            } catch (error) {
                console.log(`Failed to interact with selector: ${sel}`);
            }
        }

        if (!cookieBannerFound) {
            console.log('No cookie banner found or interaction needed');
        }

        await page.setViewportSize({ width: 1366, height: 1024 });
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`✓ Screenshot saved: ${filePath}`);
    } catch (e) {
        console.error('✗ Error taking screenshot:', e.message);
    } finally {
        await browser.close();
    }
})();