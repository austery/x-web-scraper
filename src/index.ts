import { loginInteractive } from './auth';
import { scrapeBookmarks } from './scraper';
import { getStats, getRecentlyScraped, getTotalScrapedCount } from './db';

const command = process.argv[2];
const maxTweets = parseInt(process.argv[3] || '10', 10);

async function showStats() {
    const stats = getStats();
    const recent = getRecentlyScraped(5);
    
    console.log('\n📊 Database Statistics\n');
    console.log(`Total tweets scraped: ${stats.total}`);
    console.log(`Tweets with media: ${stats.withMedia}`);
    console.log('');
    
    if (stats.topAuthors.length > 0) {
        console.log('Top Authors:');
        stats.topAuthors.forEach((author: any, idx: number) => {
            console.log(`  ${idx + 1}. ${author.author_name || author.author_handle} (@${author.author_handle}) - ${author.count} tweets`);
        });
        console.log('');
    }
    
    if (recent.length > 0) {
        console.log('Recently Scraped:');
        recent.forEach((tweet: any, idx: number) => {
            const date = new Date(tweet.scraped_at).toLocaleString();
            console.log(`  ${idx + 1}. ${tweet.author_handle} - ${date}`);
        });
    }
    
    console.log('');
}

async function main() {
    if (command === 'auth') {
        await loginInteractive();
    } else if (command === 'scrape') {
        await scrapeBookmarks(maxTweets);
    } else if (command === 'stats') {
        await showStats();
    } else {
        console.log('Usage:');
        console.log('  bun run auth          - Login to X and save session');
        console.log('  bun run scrape [N]    - Scrape N bookmarks (default: 10)');
        console.log('  bun run stats         - Show database statistics');
        console.log('');
        console.log('Examples:');
        console.log('  bun run scrape        - Scrape 10 bookmarks');
        console.log('  bun run scrape 5      - Scrape 5 bookmarks');
        console.log('  bun run scrape 20     - Scrape 20 bookmarks');
        console.log('  bun run stats         - View scraping statistics');
    }
}

main().catch(console.error);
