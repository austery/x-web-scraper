import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.join(process.cwd(), "pipeline.db");
const db = new Database(dbPath);

// Initialize schema: record tweet ID, scrape time, and file path
db.run(`
  CREATE TABLE IF NOT EXISTS scraped_tweets (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    author_handle TEXT,
    author_name TEXT,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,
    has_media INTEGER DEFAULT 0,
    media_count INTEGER DEFAULT 0
  )
`);

// Create index for faster queries
db.run(`
  CREATE INDEX IF NOT EXISTS idx_scraped_at ON scraped_tweets(scraped_at DESC)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_author ON scraped_tweets(author_handle)
`);

// Precompiled statements for performance
const queryExists = db.query("SELECT 1 FROM scraped_tweets WHERE id = $id");
const insertTweet = db.query(`
  INSERT OR IGNORE INTO scraped_tweets 
  (id, url, author_handle, author_name, file_path, has_media, media_count) 
  VALUES ($id, $url, $author_handle, $author_name, $file_path, $has_media, $media_count)
`);
const countTotal = db.query("SELECT COUNT(*) as count FROM scraped_tweets");
const queryRecent = db.query("SELECT * FROM scraped_tweets ORDER BY scraped_at DESC LIMIT $limit");

/**
 * Check if a tweet has already been scraped
 */
export function isTweetScraped(tweetId: string): boolean {
    return !!queryExists.get({ $id: tweetId });
}

/**
 * Mark a tweet as scraped in the database
 */
export function markAsScraped(
    tweetId: string, 
    url: string, 
    authorHandle: string,
    authorName: string,
    filePath: string,
    mediaCount: number = 0
) {
    insertTweet.run({ 
        $id: tweetId, 
        $url: url, 
        $author_handle: authorHandle,
        $author_name: authorName,
        $file_path: filePath,
        $has_media: mediaCount > 0 ? 1 : 0,
        $media_count: mediaCount
    });
}

/**
 * Get total count of scraped tweets
 */
export function getTotalScrapedCount(): number {
    const result = countTotal.get() as { count: number };
    return result.count;
}

/**
 * Get recently scraped tweets
 */
export function getRecentlyScraped(limit: number = 10): any[] {
    return queryRecent.all({ $limit: limit }) as any[];
}

/**
 * Get statistics
 */
export function getStats() {
    const total = getTotalScrapedCount();
    const withMedia = db.query("SELECT COUNT(*) as count FROM scraped_tweets WHERE has_media = 1").get() as { count: number };
    const topAuthors = db.query(`
        SELECT author_handle, author_name, COUNT(*) as count 
        FROM scraped_tweets 
        GROUP BY author_handle 
        ORDER BY count DESC 
        LIMIT 10
    `).all();

    return {
        total,
        withMedia: withMedia.count,
        topAuthors
    };
}

/**
 * Export for debugging
 */
export { db };
