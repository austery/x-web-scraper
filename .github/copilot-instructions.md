# GitHub Copilot Instructions for X Web Scraper

## Project Overview

This is a **X (Twitter) bookmark scraper** built with:
- **Runtime**: Bun (JavaScript runtime)
- **Language**: TypeScript
- **Automation**: Playwright (browser automation)
- **Output**: Markdown files with Obsidian-compatible frontmatter

## Core Architecture

### Two-Phase Scraping Strategy

The scraper uses a **two-phase approach** to avoid tweet truncation:

1. **Phase 1 - URL Collection** (`collectTweetUrls`)
   - Fast scrolling through bookmarks feed
   - Collect tweet URLs and IDs only
   - No content extraction at this stage
   
2. **Phase 2 - Content Extraction** (`extractFullTweetContent`)
   - Visit each tweet's detail page individually
   - Extract complete tweet text (no truncation)
   - Sequential processing with rate limiting

### File Structure

```
src/
├── index.ts      # CLI entry point, argument parsing
├── auth.ts       # Authentication with session persistence
├── scraper.ts    # Main scraping logic (two-phase approach)
└── parser.ts     # Markdown formatting and file saving
```

## Key Design Decisions

### 1. Why Two-Phase Approach?
- **Problem**: Tweets in feed view are often truncated
- **Solution**: Visit detail pages to get full content
- **Trade-off**: Slower but more accurate

### 2. Rate Limiting Strategy
- **Random delays**: 3-5 seconds between tweets
- **Sequential processing**: Never parallel to avoid detection
- **Human-like behavior**: Random timing mimics real users

### 3. Authentication
- **Session persistence**: Stores cookies in `storageState.json`
- **Pre-flight check**: Verifies auth before scraping
- **Manual login**: Interactive browser for security

## Important Functions

### `scrapeBookmarks(maxTweets: number)`
Main orchestrator:
1. Verify authentication
2. Collect URLs (Phase 1)
3. Extract content (Phase 2)
4. Save to Markdown files

### `collectTweetUrls(page, maxTweets)`
Phase 1 implementation:
- Scrolls bookmarks page
- Extracts URLs from `<time>` element's parent link
- Uses Map to deduplicate
- Returns `TweetUrlData[]`

### `extractFullTweetContent(page, url, id)`
Phase 2 implementation:
- Navigates to tweet detail page
- Uses `div[data-testid="tweetText"]` for text extraction
- DOM tree walking for proper formatting
- Handles quoted tweets, media, etc.
- Returns `TweetData | null`

### `randomDelay(min, max)`
Rate limiting utility:
- Generates random millisecond delay
- Current range: 3000-5000ms (3-5 seconds)
- Used between tweet extractions

## DOM Selectors (X.com Structure)

These selectors are **fragile** and may break if X updates their HTML:

```typescript
'article[data-testid="tweet"]'        // Tweet container
'div[data-testid="tweetText"]'        // Tweet content
'div[data-testid="User-Name"]'        // Author info
'time'                                 // Timestamp
'img[alt="Image"]'                     // Images
'video'                                // Videos
'div[role="link"]'                     // Quoted tweets
```

## Edge Cases Handled

1. **Quoted Tweets**: Detected via `div[role="link"]`, appended to content
2. **Media**: Images and videos captured, profile images filtered
3. **Missing Data**: Graceful fallbacks (e.g., "Unknown" author)
4. **Long Tweets**: Full extraction via detail page visit
5. **Hashtags**: Extracted via regex for tags

## Code Patterns

### When modifying scraper logic:

```typescript
// ✅ GOOD: Sequential with delays
for (const tweet of tweets) {
    await processTweet(tweet);
    await randomDelay(3000, 5000);
}

// ❌ BAD: Parallel processing (will get rate limited)
await Promise.all(tweets.map(t => processTweet(t)));
```

### When adding new data extraction:

```typescript
// ✅ GOOD: Null-safe with fallback
const author = await element?.$('selector')?.innerText() || 'Unknown';

// ❌ BAD: Will crash if element missing
const author = await element.$('selector').innerText();
```

### When working with Playwright:

```typescript
// ✅ GOOD: Wait for element before interaction
await page.waitForSelector('article', { timeout: 10000 });
const tweets = await page.$$('article');

// ❌ BAD: Race condition possible
const tweets = await page.$$('article'); // Might be empty
```

## Performance Considerations

- **Phase 1**: Fast (~2-3 seconds for 10 tweets)
- **Phase 2**: Slow by design (~4-6 seconds per tweet with delays)
- **Total**: ~50-70 seconds for 10 tweets
- **Rate limiting is intentional** - don't optimize it away!

## Testing Guidelines

When making changes, test with:

```bash
# Small test run
bun run scrape 3

# Check output quality
ls -l output/
cat output/_username-*.md
```

Look for:
- ✅ Full tweet content (no "..." truncation)
- ✅ Proper frontmatter format
- ✅ Media URLs present
- ✅ No duplicate files
- ✅ Quoted tweets included

## Common Issues & Solutions

### "Could not find tweets"
- Session expired → Run `bun run auth`
- Selector changed → Update DOM selectors

### Tweets still truncated
- Not visiting detail page → Check Phase 2 navigation
- Wrong selector → Verify `tweetText` selector

### Rate limiting / 429 errors
- Delays too short → Increase `randomDelay` range
- Too many requests → Reduce tweets per run

### Empty text extraction
- Check `div[data-testid="tweetText"]` selector
- Fallback to `innerText()` should catch it
- X may have changed HTML structure

## Maintenance Notes

### X.com DOM Changes
This scraper is **brittle by nature** - it depends on X's HTML structure. When X updates their site:

1. Check browser DevTools for new selectors
2. Update selectors in `extractFullTweetContent()`
3. Test with variety of tweet types
4. Document changes in git commit

### Rate Limiting Adjustments
If getting rate limited:
1. Increase delays in `randomDelay(3000, 5000)`
2. Add random delay in Phase 1 scrolling
3. Consider exponential backoff on errors

### Adding New Fields
To extract additional data (e.g., likes, retweets):

1. Find selector in browser DevTools
2. Add to `extractFullTweetContent()`
3. Update `TweetData` interface in `parser.ts`
4. Update `formatMarkdown()` to include in output

## Development Commands

```bash
# Run scraper
bun run scrape [N]

# Run authentication
bun run auth

# Development mode (with logs)
bun run src/index.ts scrape 3

# Check TypeScript (optional)
bun run tsc --noEmit
```

## Dependencies

```json
{
  "playwright": "latest",    // Browser automation
  "zod": "latest",          // Type validation (if needed)
  "bun-types": "latest",    // Bun type definitions
  "@types/node": "^25.0.6"  // Node.js types
}
```

## Security & Privacy

- **Local only**: No external API calls
- **Session storage**: `storageState.json` contains auth cookies
- **No analytics**: No tracking or telemetry
- **Personal use**: Respect X's ToS and rate limits

## Future Enhancement Ideas

1. **Resume capability**: Skip already-scraped tweets
2. **Incremental mode**: Only scrape new bookmarks
3. **Filter options**: By author, media type, date
4. **Export formats**: JSON, CSV, HTML
5. **Thread handling**: Auto-expand and capture threads
6. **Parallel with queue**: Controlled concurrency with rate limiting

## Code Style

- **Async/await**: Preferred over promises
- **Arrow functions**: For utilities and callbacks
- **Type safety**: Use TypeScript types, avoid `any`
- **Error handling**: Try-catch with graceful degradation
- **Logging**: Clear emoji-based progress indicators
- **Comments**: Only for non-obvious logic

## AI Assistant Guidelines

When helping with this codebase:

1. **Preserve rate limiting** - it's critical for avoiding bans
2. **Test DOM selectors** - X changes them frequently
3. **Keep sequential processing** - don't parallelize Phase 2
4. **Maintain two-phase approach** - it solves the truncation issue
5. **Update docs** if making significant changes
6. **Consider bot detection** - make behavior more human-like

---

**Last Updated**: 2026-01-11  
**Status**: Production Ready  
**Maintainer**: leipeng
