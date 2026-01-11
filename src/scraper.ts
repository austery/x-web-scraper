import { getAuthenticatedContext } from './auth';
import { saveBookmark, type TweetData } from './parser';
import { isTweetScraped, markAsScraped, getTotalScrapedCount } from './db';
import path from 'path';
import type { Page } from 'playwright';

interface TweetUrlData {
    id: string;
    url: string;
}

function randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function verifyAuthentication(page: Page): Promise<boolean> {
    try {
        await page.goto('https://x.com/home', { timeout: 10000 });
        await page.waitForSelector('article[data-testid="tweet"]', { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

async function collectTweetUrls(page: Page, maxTweets: number = 10): Promise<TweetUrlData[]> {
    console.log('📋 Phase 1: Collecting tweet URLs from bookmarks...');
    
    await page.goto('https://x.com/i/bookmarks');
    
    try {
        await page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });
    } catch (e) {
        throw new Error('Could not find tweets. Authentication may have failed.');
    }

    const collectedUrls = new Map<string, TweetUrlData>();
    let scrollAttempts = 0;
    const MAX_SCROLL_ATTEMPTS = 30;
    let newTweetsCount = 0;

    while (collectedUrls.size < maxTweets && scrollAttempts < MAX_SCROLL_ATTEMPTS) {
        const tweets = await page.$$('article[data-testid="tweet"]');

        for (const tweetEl of tweets) {
            if (collectedUrls.size >= maxTweets) break;

            try {
                const timeEl = await tweetEl.$('time');
                if (!timeEl) continue;

                const timeParent = await timeEl.evaluateHandle(el => el.parentElement);
                const href = await timeParent.getAttribute('href');
                
                if (!href) continue;

                const url = `https://x.com${href}`;
                const idMatch = url.match(/status\/(\d+)/);
                const id = idMatch ? idMatch[1] : null;

                if (id && !collectedUrls.has(id)) {
                    collectedUrls.set(id, { id, url });
                    newTweetsCount++;
                    console.log(`  ✓ Collected: ${url}`);
                }
            } catch (err) {
                continue;
            }
        }

        // If we haven't found new tweets in a while, we might have reached the end
        if (newTweetsCount === 0 && scrollAttempts > 5) {
            console.log('  ℹ️  No new tweets found, stopping collection');
            break;
        }

        await page.evaluate(() => window.scrollBy(0, 1000));
        await randomDelay(1500, 2500);
        scrollAttempts++;
    }

    console.log(`📋 Phase 1 complete: Collected ${collectedUrls.size} tweet URLs\n`);
    return Array.from(collectedUrls.values());
}

async function extractFullTweetContent(page: Page, tweetUrl: string, tweetId: string): Promise<TweetData | null> {
    try {
        await page.goto(tweetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await randomDelay(2000, 4000);

        await page.waitForSelector('article[data-testid="tweet"]', { timeout: 10000 });

        const mainTweet = await page.$('article[data-testid="tweet"]');
        if (!mainTweet) {
            console.log(`  ⚠️  Could not find main tweet on detail page`);
            return null;
        }

        const userEl = await mainTweet.$('div[data-testid="User-Name"]');
        const rawUserText = await userEl?.innerText() || '';
        const userParts = rawUserText.split('\n');
        const authorName = userParts[0] || 'Unknown';
        const authorHandle = userParts.find(s => s.startsWith('@')) || '@unknown';

        const timeEl = await mainTweet.$('time');
        const publishedDate = await timeEl?.getAttribute('datetime') || '';

        const tweetTextEl = await mainTweet.$('div[data-testid="tweetText"]');
        let fullText = '';
        
        if (tweetTextEl) {
            fullText = await tweetTextEl.evaluate(el => {
                const textNodes: string[] = [];
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
                let node: Node | null;
                
                while (node = walker.nextNode()) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        textNodes.push(node.textContent || '');
                    } else if (node.nodeName === 'BR') {
                        textNodes.push('\n');
                    }
                }
                
                return textNodes.join('').trim();
            });
        }

        if (!fullText) {
            const fallbackText = await mainTweet.innerText().catch(() => '');
            fullText = fallbackText.replace(rawUserText, '').trim();
        }

        const mediaUrls: string[] = [];
        
        // Use data-testid to locate image containers, independent of language
        const photoContainers = await mainTweet.$$('div[data-testid="tweetPhoto"] img');
        for (const img of photoContainers) {
            const src = await img.getAttribute('src');
            if (src) {
                mediaUrls.push(src);
            }
        }

        const videos = await mainTweet.$$('video');
        for (const video of videos) {
            const poster = await video.getAttribute('poster');
            if (poster) mediaUrls.push(poster);
        }

        const quotedTweet = await mainTweet.$('div[role="link"]');
        if (quotedTweet) {
            const quotedText = await quotedTweet.innerText().catch(() => '');
            if (quotedText && !fullText.includes(quotedText)) {
                fullText += `\n\n> Quoted Tweet:\n> ${quotedText.split('\n').join('\n> ')}`;
            }
        }

        return {
            id: tweetId,
            url: tweetUrl,
            text: fullText,
            authorName,
            authorHandle,
            publishedDate: publishedDate.split('T')[0],
            mediaUrls
        };

    } catch (err) {
        console.log(`  ❌ Error extracting content: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return null;
    }
}

export async function scrapeBookmarks(maxTweets: number = 10) {
    const { page, close } = await getAuthenticatedContext(false);

    try {
        console.log('🔐 Verifying authentication...');
        const isAuthenticated = await verifyAuthentication(page);
        
        if (!isAuthenticated) {
            console.error('❌ Authentication failed. Please run "bun run auth" first.');
            return;
        }
        
        console.log('✅ Authentication verified');
        
        // Show current database stats
        const totalScraped = getTotalScrapedCount();
        console.log(`📊 Database: ${totalScraped} tweets already scraped\n`);

        const tweetUrls = await collectTweetUrls(page, maxTweets);
        
        if (tweetUrls.length === 0) {
            console.log('No tweets found to process.');
            return;
        }

        console.log('📝 Phase 2: Extracting full tweet content...');
        const outputDir = path.join(process.cwd(), 'output');
        let successCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < tweetUrls.length; i++) {
            const { id, url } = tweetUrls[i];

            // 🛑 Critical check: Skip if already scraped
            if (isTweetScraped(id)) {
                console.log(`\n[${i + 1}/${tweetUrls.length}] ⏭️  Skipping (Already scraped): ${id}`);
                skippedCount++;
                continue;
            }

            console.log(`\n[${i + 1}/${tweetUrls.length}] Processing: ${url}`);

            const tweetData = await extractFullTweetContent(page, url, id);

            if (tweetData) {
                const savedPath = saveBookmark(tweetData, outputDir);
                
                // ✅ Record in database after successful scrape
                markAsScraped(
                    id, 
                    url, 
                    tweetData.authorHandle,
                    tweetData.authorName,
                    savedPath,
                    tweetData.mediaUrls.length
                );
                
                successCount++;
                console.log(`  ✅ Saved & Recorded in DB`);
            } else {
                console.log(`  ⚠️  Skipped due to extraction error`);
            }

            if (i < tweetUrls.length - 1) {
                const delay = Math.floor(Math.random() * 2000) + 3000;
                console.log(`  ⏳ Waiting ${(delay / 1000).toFixed(1)}s before next tweet...`);
                await randomDelay(3000, 5000);
            }
        }

        const newTotal = getTotalScrapedCount();
        console.log(`\n✨ Done! Successfully scraped ${successCount} new tweets (${skippedCount} already existed).`);
        console.log(`📊 Total in database: ${newTotal} tweets`);

    } catch (e) {
        console.error('❌ Error during scraping:', e);
    } finally {
        await close();
    }
}
