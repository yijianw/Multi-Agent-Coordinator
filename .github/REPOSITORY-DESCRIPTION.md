# GitHub 仓库描述

## 短描述 (用于 About 区域)

强大的多 Agent 并行执行与可视化工具 - 基于 OpenClaw 构建，支持流水线/并行/讨论/混合工作流，提供实时状态监控和进度可视化。

## 长描述 (用于 README 顶部)

🦞 **Multi-Agent Coordinator** 是一个功能强大的多 Agent 并行执行与可视化工具，专为 OpenClaw 设计。

### 核心特性

- 🎨 现代化 Web UI - 基于 React + Vite
- ⚡ 真实执行 - 直接调用 OpenClaw CLI
- 📊 实时监控 - 可视化展示执行状态和进度
- 🔀 4 种工作流 - 流水线/并行/讨论/混合
- 💬 Agent 通信 - Agent 间可以互相协作
- 🎯 手动干预 - 支持暂停/继续/终止 Agent
- 📈 进度可视化 - 甘特图、统计面板、状态动画

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/multi-agent-coordinator.git
cd multi-agent-coordinator

# 安装依赖
npm install
cd web-ui && npm install && cd ..

# 启动服务
node bin/multi-agent-server.js  # 终端 1
cd web-ui && npm run dev        # 终端 2

# 访问 http://localhost:5173/
```

### 测试覆盖

✅ **80/80 测试全部通过 (100%)**

- 核心 Skill: 8/8
- Web UI: 10/10
- 通信与持久化: 10/10
- 高级功能: 52/52

### 技术栈

- **前端:** React 18, Vite, CSS3
- **后端:** Node.js 20+, Express (内置)
- **AI:** OpenClaw 2026.3.28+
- **测试:** 自定义测试框架

### 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

### 贡献

我们欢迎所有形式的贡献！详见 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 仓库标签 (Topics)

```
openclaw
multi-agent
ai-automation
visualization
workflow
react
nodejs
orchestration
parallel-execution
developer-tools
```

---

## 特性列表 (用于 GitHub Features)

✅ 多 Agent 并行执行
✅ 4 种工作流模式
✅ 实时状态监控
✅ 进度可视化
✅ Agent 间通信
✅ 手动干预功能
✅ Web 界面配置
✅ 独立服务器模式
✅ 80+ 测试覆盖
✅ 完整文档

---

## 截图说明

建议添加以下截图到 `docs/screenshots/`:

1. **agent-config.png** - Agent 配置界面
2. **workflow-modes.png** - 工作流模式选择
3. **monitoring.png** - 实时监控面板
4. **discussion.png** - Agent 讨论界面
5. **intervention.png** - 手动干预面板
6. **gantt.png** - 甘特图可视化

---

## 徽章 (Badges)

```markdown
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-green.svg)](https://docs.openclaw.ai)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-80%2F80-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)]()
```

---

## 仓库链接

- **主页:** https://github.com/YOUR_USERNAME/multi-agent-coordinator
- **文档:** https://github.com/YOUR_USERNAME/multi-agent-coordinator/tree/main/docs
- **问题:** https://github.com/YOUR_USERNAME/multi-agent-coordinator/issues
- **PR:** https://github.com/YOUR_USERNAME/multi-agent-coordinator/pulls
