# 更新日志 / Changelog

## [1.0.1] - 2026-01-11

### 🐛 修复 / Fixed

**关键修复：图片选择器语言本地化问题**

#### 问题 / Issue
- 原代码使用 `img[alt="Image"]` 选择器提取图片
- 该选择器依赖 `alt` 属性的英文值
- 在中文环境下，X 会将 `alt="Image"` 渲染为 `alt="图片"`
- 导致无法提取任何图片

#### 解决方案 / Solution
```typescript
// ❌ Before (language-dependent)
const images = await mainTweet.$$('img[alt="Image"]');

// ✅ After (language-independent)
const photoContainers = await mainTweet.$$('div[data-testid="tweetPhoto"] img');
```

#### 优势 / Benefits
- ✅ **语言无关**: 使用结构化 `data-testid` 属性
- ✅ **更稳定**: 不依赖可能变化的文本属性
- ✅ **更精确**: 直接定位推文照片容器
- ✅ **跨地区**: 适用于任何语言环境的 X 账号

#### 测试结果 / Test Results
- ✅ 成功提取图片 URL
- ✅ 中英文环境均可正常工作
- ✅ 向后兼容，不影响现有功能

### 📝 文档更新 / Documentation

- 更新 `.github/copilot-instructions.md`
  - 添加语言本地化注意事项
  - 更新 DOM 选择器文档
  - 增加最佳实践示例

---

## [1.0.0] - 2026-01-11

### ✨ 初始发布 / Initial Release

#### 核心特性 / Core Features
- ✅ 两阶段抓取策略（URL 收集 + 内容提取）
- ✅ 完整推文内容提取（解决截断问题）
- ✅ 速率限制和反爬虫机制
- ✅ 认证管理和会话持久化
- ✅ Markdown 输出格式
- ✅ 边界情况处理（引用推文、媒体、话题标签）

#### 技术实现 / Technical Implementation
- 使用 Bun + TypeScript + Playwright
- TreeWalker 文本提取技术
- 随机延迟模拟人类行为
- 防御性编程和错误处理

#### 文档 / Documentation
- README.md - 用户指南（中英双语）
- IMPLEMENTATION_SUMMARY.md - 技术文档
- .github/copilot-instructions.md - AI 助手指南

---

## 版本规范 / Versioning

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)

- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能性新增
- **修订号 (Patch)**: 向下兼容的问题修正

---

**Maintained by**: leipeng  
**Last Updated**: 2026-01-11
