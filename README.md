# X (Twitter) Bookmark Scraper

A robust web scraper built with Bun, TypeScript, and Playwright to extract your X (Twitter) bookmarks and save them as Markdown files with full content and metadata.

## ✨ Features

- **Two-Phase Scraping Strategy**: Collects tweet URLs first, then extracts full content from detail pages
- **Full Tweet Content**: No more truncated long tweets - gets complete text from detail pages
- **Sequential Processing**: Processes tweets one by one to avoid bot detection
- **Rate Limiting**: Random delays (3-5 seconds) between requests to mimic human behavior
- **Authentication Management**: Persistent session storage for seamless re-runs
- **Rich Metadata**: Extracts author info, publish dates, media URLs, and hashtags
- **Markdown Output**: Saves tweets in Obsidian-compatible format with frontmatter
- **Edge Case Handling**: 
  - Handles quoted tweets
  - Captures images and videos
  - Filters out profile images
  - Extracts hashtags for tags

## 🚀 Quick Start

### Installation

```bash
bun install
```

### Authentication

First, authenticate with X (Twitter):

```bash
bun run auth
```

This will:
1. Open a browser window
2. Navigate to X login page
3. Wait for you to log in manually
4. Save your session to `storageState.json`

You only need to do this once. The session persists between runs.

### Scrape Bookmarks

```bash
# Scrape 10 bookmarks (default)
bun run scrape

# Scrape specific number of bookmarks
bun run scrape 5
bun run scrape 20
bun run scrape 50
```

## 📋 Output Format

Tweets are saved to the `output/` directory with filenames like:

```
_username-1234567890.md
```

Each file contains:

```markdown
---
title: Author Name on X: "Tweet preview..."
aliases:
created: 2026-01-11
source: https://x.com/username/status/1234567890
author:
  - "@username"
published: 2026-01-09
summary: Tweet preview text...
tags:
  - hashtag1
  - hashtag2
  - twitter-bookmark
status: inbox
insight:
project:
category:
area:
updated: 2026-01-11T12:00
---

Full tweet text goes here...

![](https://media-url.jpg)
```

## 🛠️ Technical Details

### Project Structure

```
x-web-scraper/
├── src/
│   ├── index.ts      # CLI entry point
│   ├── auth.ts       # Authentication logic
│   ├── scraper.ts    # Main scraping logic (two-phase approach)
│   └── parser.ts     # Markdown formatting and file saving
├── output/           # Scraped tweets saved here
├── storageState.json # Persisted session (gitignored)
└── package.json
```

### Two-Phase Scraping Approach

**Phase 1: URL Collection**
- Navigate to bookmarks page
- Scroll and collect tweet URLs
- Fast and efficient
- Handles pagination automatically

**Phase 2: Content Extraction**
- Visit each tweet detail page sequentially
- Extract full text content (no truncation)
- Capture all media URLs
- Handle quoted tweets
- Apply rate limiting between requests

### Safety Features

- **Authentication Verification**: Checks login status before scraping
- **Random Delays**: 3-5 seconds between tweets to avoid detection
- **Headless Mode**: Runs with browser visible for debugging (configurable)
- **Error Handling**: Gracefully skips problematic tweets
- **Progress Logging**: Clear feedback on scraping progress

## 🎯 Use Cases

- **Knowledge Management**: Import bookmarks into Obsidian or other note-taking apps
- **Content Archival**: Preserve tweets before they're deleted
- **Research**: Collect and organize Twitter threads for analysis
- **Backup**: Create local copies of your bookmarked content

## ⚙️ Configuration

### Adjust Maximum Tweets

Modify the default in `src/scraper.ts`:

```typescript
export async function scrapeBookmarks(maxTweets: number = 10)
```

### Adjust Rate Limiting

Modify delays in `src/scraper.ts`:

```typescript
await randomDelay(3000, 5000); // Current: 3-5 seconds
```

### Enable/Disable Headless Mode

In `src/scraper.ts`:

```typescript
const { page, close } = await getAuthenticatedContext(false); // false = visible, true = headless
```

## 🐛 Troubleshooting

### "Could not find tweets. Authentication may have failed."

- Run `bun run auth` again to re-authenticate
- Make sure you completed the login process
- Check that `storageState.json` exists

### Tweets are still truncated

- The scraper now visits detail pages, so truncation should be resolved
- If issues persist, check the DOM selectors in `extractFullTweetContent()`

### Rate limiting / Getting blocked

- Increase delays in `randomDelay()` function
- Reduce the number of tweets per run
- Add longer delays between runs

## 📝 Development

### Run in development mode

```bash
bun run src/index.ts scrape 3
```

### Type checking

```bash
bun run tsc --noEmit
```

## 🔒 Privacy & Security

- **Local Only**: All data stays on your machine
- **Session Storage**: `storageState.json` contains authentication cookies (gitignored)
- **No Analytics**: No data is sent to external services
- **Open Source**: Review the code to verify behavior

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🤝 Contributing

This is a personal project, but feel free to fork and adapt for your needs.

## ⚠️ Disclaimer

This tool is for personal use only. Respect X's Terms of Service and rate limits. Use responsibly.

---

Built with ❤️ using Bun, TypeScript, and Playwright
