import { loginInteractive } from './auth';
import { scrapeBookmarks } from './scraper';

const command = process.argv[2];
const maxTweets = parseInt(process.argv[3] || '10', 10);

async function main() {
    if (command === 'auth') {
        await loginInteractive();
    } else if (command === 'scrape') {
        await scrapeBookmarks(maxTweets);
    } else {
        console.log('Usage:');
        console.log('  bun run auth          - Login to X and save session');
        console.log('  bun run scrape [N]    - Scrape N bookmarks (default: 10)');
        console.log('');
        console.log('Examples:');
        console.log('  bun run scrape        - Scrape 10 bookmarks');
        console.log('  bun run scrape 5      - Scrape 5 bookmarks');
        console.log('  bun run scrape 20     - Scrape 20 bookmarks');
    }
}

main().catch(console.error);
