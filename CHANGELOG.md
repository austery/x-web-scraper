# 更新日志 / Changelog

## [1.1.0] - 2026-01-11

### ✨ 新功能 / New Features

**SQLite 状态管理系统** - 从"脚本"进化为"系统"

#### 核心功能

1. **增量加载** - 自动跳过已抓取的推文
2. **智能去重** - Phase 1 后立即查询数据库，减少API调用  
3. **统计功能** - `bun run src/index.ts stats` 查看抓取历史

#### 新文件

- `src/db.ts` - SQLite数据库封装
- `pipeline.db` - 状态数据库（已加入.gitignore）

#### 架构理念

- X Bookmarks = Inbox (临时队列)
- Obsidian = Archive (永久存储)  
- SQLite = Control Plane (状态管理)

---

## [1.0.1] - 2026-01-11

### 🐛 修复

**图片选择器语言本地化问题**

- 从 `img[alt="Image"]` 改为 `div[data-testid="tweetPhoto"] img`
- 解决中文环境下无法提取图片的问题

---

## [1.0.0] - 2026-01-11

### ✨ 初始发布

- 两阶段抓取策略
- 完整推文内容提取
- 速率限制和反爬虫
- Markdown输出格式
