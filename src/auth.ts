import { chromium, type BrowserContext, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE_PATH = path.join(process.cwd(), 'storageState.json');

export async function getAuthenticatedContext(headless: boolean = true): Promise<{ context: BrowserContext; page: Page; close: () => Promise<void> }> {
    const browser = await chromium.launch({
        headless: headless,
    });

    let context: BrowserContext;

    if (fs.existsSync(STORAGE_STATE_PATH)) {
        console.log('Loading existing session...');
        context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    } else {
        console.log('No existing session found. Starting new session...');
        context = await browser.newContext();
    }

    const page = await context.newPage();

    return {
        context,
        page,
        close: async () => {
            if (fs.existsSync(STORAGE_STATE_PATH)) {
                // Save state before closing if we want to update cookies (optional, usually login script does the save)
                await context.storageState({ path: STORAGE_STATE_PATH });
            }
            await browser.close();
        },
    };
}

export async function loginInteractive() {
    console.log('Launching browser for interactive login...');
    console.log('Please log in to X (Twitter) in the browser window.');
    console.log('The script will wait until you close the browser window or navigate to home.');

    // Launch non-headless for manual login
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    try {
        await page.goto('https://x.com/i/flow/login');

        // Wait for user to be logged in (detect by checking for home URL or a specific element)
        // For simplicity, we can wait for the user to close the browser, 
        // OR we can poll for a specific cookie/url.
        // Let's rely on a long timeout and manual closing or specific navigation.

        console.log('Waiting for you to log in... (Address bar should show x.com/home)');

        // Wait indefinitely until url contains 'home'
        await page.waitForURL('**/home', { timeout: 0 });

        console.log('Login detected! Saving session...');
        await context.storageState({ path: STORAGE_STATE_PATH });
        console.log(`Session saved to ${STORAGE_STATE_PATH}`);

    } catch (e) {
        console.error('Login process interrupted or failed:', e);
    } finally {
        await browser.close();
    }
}
