# X (Twitter) Bookmark Scraper

一个强大的网页爬虫工具，使用 Bun、TypeScript 和 Playwright 构建，用于提取你的 X (Twitter) 书签并保存为完整内容的 Markdown 文件。

A robust web scraper built with Bun, TypeScript, and Playwright to extract your X (Twitter) bookmarks and save them as Markdown files with full content and metadata.

## ✨ 核心特性 / Features

- **两阶段抓取策略**: 先收集推文 URL，再从详情页提取完整内容 → **彻底解决长推文截断问题**
- **完整推文内容**: 不再截断 - 访问详情页获取完整文本
- **顺序处理**: 逐条处理推文，避免被检测为机器人
- **速率限制**: 请求之间随机延迟 3-5 秒，模拟人类行为
- **认证管理**: 持久化会话存储，无需重复登录
- **丰富元数据**: 提取作者信息、发布日期、媒体 URL 和话题标签
- **Markdown 输出**: Obsidian 兼容格式，带完整 frontmatter
- **边界情况处理**: 
  - 处理引用推文
  - 捕获图片和视频
  - 过滤个人头像
  - 提取话题标签

## 🚀 快速开始 / Quick Start

### 1. 安装依赖 / Installation

```bash
bun install
```

### 2. 首次认证 / Authentication

首次使用需要登录 X (Twitter)：

```bash
bun run auth
```

这个命令会：
1. 打开浏览器窗口
2. 导航到 X 登录页面
3. 等待你手动登录
4. 将会话保存到 `storageState.json`

只需执行一次，会话会持久保存。

### 3. 抓取书签 / Scrape Bookmarks

```bash
# 抓取 10 条书签（默认）
bun run scrape

# 抓取指定数量
bun run scrape 5      # 5 条
bun run scrape 20     # 20 条
bun run scrape 50     # 50 条
```

### 运行示例 / Example Output

```
🔐 Verifying authentication...
✅ Authentication verified

📋 Phase 1: Collecting tweet URLs from bookmarks...
  ✓ Collected: https://x.com/user/status/123
  ✓ Collected: https://x.com/user/status/456
📋 Phase 1 complete: Collected 2 tweet URLs

📝 Phase 2: Extracting full tweet content...

[1/2] Processing: https://x.com/user/status/123
  ✅ Saved successfully
  ⏳ Waiting 3.8s before next tweet...

[2/2] Processing: https://x.com/user/status/456
  ✅ Saved successfully

✨ Done! Successfully scraped 2/2 bookmarks.
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

## 🐛 常见问题 / Troubleshooting

### ❌ "Could not find tweets. Authentication may have failed."

**解决方案**:
- 重新运行 `bun run auth` 认证
- 确保完成了登录流程
- 检查 `storageState.json` 文件是否存在

### ❌ 推文仍然被截断

现在不应该出现截断了！爬虫会访问详情页获取完整内容。
- 如果仍有问题，检查 `extractFullTweetContent()` 中的 DOM 选择器
- X 可能更新了页面结构

### ❌ 速率限制 / 被封禁

爬虫已有 3-5 秒延迟，如果仍被限制：
- 增加 `randomDelay()` 的延迟范围
- 每次运行抓取更少的推文
- 在多次运行之间增加等待时间

### ⚠️ 会话过期

定期重新认证（每几周一次）：
```bash
bun run auth
```

## 📚 文档 / Documentation

- **README.md** (本文件) - 快速开始和基本使用
- **IMPLEMENTATION_SUMMARY.md** - 技术实现细节和架构说明
- **.github/copilot-instructions.md** - AI 助手指南（给 GitHub Copilot 阅读）

## 📝 开发 / Development

```bash
# 开发模式运行
bun run src/index.ts scrape 3

# 查看项目结构
ls -la src/
```

## 🔒 隐私与安全 / Privacy & Security

- ✅ **本地运行**: 所有数据保存在本地
- ✅ **会话存储**: `storageState.json` 包含认证 cookies（已加入 .gitignore）
- ✅ **无追踪**: 不向任何外部服务发送数据
- ✅ **开源**: 代码可审查

## 📊 性能 / Performance

- **阶段 1**: 快速收集 URL（~2-3 秒 / 10 条推文）
- **阶段 2**: 含延迟的内容提取（~4-6 秒 / 每条）
- **总计**: 约 50-70 秒 / 10 条推文

速度慢是**设计特性**，用于避免触发反爬机制。

## ⚠️ 免责声明 / Disclaimer

本工具仅供个人使用。请遵守 X 的服务条款和速率限制。负责任地使用。

This tool is for personal use only. Respect X's Terms of Service and rate limits. Use responsibly.

---

Built with ❤️ using Bun, TypeScript, and Playwright

**Version**: 1.0.0  
**Last Updated**: 2026-01-11
