import fs from 'fs';
import path from 'path';

export interface TweetData {
    id: string;
    url: string;
    text: string;
    authorName: string;
    authorHandle: string;
    // We might extract a more precise date if possible, but 'today' is often used for 'created'
    publishedDate?: string;
    mediaUrls: string[];
}

export function formatMarkdown(tweet: TweetData): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const updatedTime = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

    const summary = tweet.text.slice(0, 150).replace(/\n/g, ' ') + (tweet.text.length > 150 ? '...' : '');

    // Attempt to extract tags (simple regex for hashtags)
    const hashtags = tweet.text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];

    // Frontmatter logic
    const frontMatter = `---
title: ${tweet.authorName} on X: "${summary.slice(0, 50)}..."
aliases:
created: ${today}
source: ${tweet.url}
author:
  - "${tweet.authorHandle}"
published: ${tweet.publishedDate || today}
summary: ${summary}
tags:
${hashtags.length > 0 ? hashtags.map(t => `  - ${t}`).join('\n') : '  - twitter-bookmark'}
status: inbox
insight:
project:
category:
area:
updated: ${updatedTime}
---
${tweet.text}

${tweet.mediaUrls.map(url => `![](${url})`).join('\n\n')}
`;

    return frontMatter;
}

export function saveBookmark(tweet: TweetData, outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sanitize filename
    const sanitizedTitle = `${tweet.authorHandle}-${tweet.id}`.replace(/[^a-z0-9-]/gi, '_');
    const filename = `${sanitizedTitle}.md`;
    const filePath = path.join(outputDir, filename);

    const content = formatMarkdown(tweet);
    fs.writeFileSync(filePath, content);
    console.log(`Saved: ${filename}`);
    
    return filePath;
}
