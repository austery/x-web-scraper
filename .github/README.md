# 关于这个文件夹 / About This Directory

这个 `.github/` 文件夹包含项目的辅助文档和配置。

This `.github/` directory contains auxiliary documentation and configuration for the project.

## 📁 文件说明 / Files

### copilot-instructions.md

**用途**: GitHub Copilot 和其他 AI 助手的专用指南

**内容包括**:
- 项目架构和设计决策
- 关键函数说明
- DOM 选择器文档（容易过时，需要维护）
- 代码模式和最佳实践
- 常见问题和解决方案
- 开发指南和测试方法

**目标读者**: AI 编程助手（GitHub Copilot, Cursor, etc.）

**为什么需要这个文件**:
- 帮助 AI 理解项目的核心设计理念
- 提供上下文信息，使 AI 建议更准确
- 文档化容易改变的部分（如 X.com 的 DOM 结构）
- 强调关键约束（如速率限制、顺序处理）

## 🔄 维护建议 / Maintenance

当项目有重大变更时，记得同步更新 `copilot-instructions.md`：

- X.com DOM 结构变化时
- 添加新功能或模块时
- 修改核心架构时
- 发现新的最佳实践时

---

**Last Updated**: 2026-01-11
