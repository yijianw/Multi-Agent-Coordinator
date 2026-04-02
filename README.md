# 🦞 Multi-Agent Coordinator

<div align="center">

**多 Agent 并行执行与可视化工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-green.svg)](https://docs.openclaw.ai)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)

[致谢](#-致谢与灵感来源) • [功能特性](#-功能特性) • [快速开始](#-快速开始) • [架构设计](#-架构设计) • [贡献](#-贡献)

</div>

---

## 🙏 致谢与灵感来源

> **本项目核心代码逻辑参考了 [Claude Code](https://github.com/anthropics/claude-code) 开源项目的 TypeScript 源码。**

我们深入研究了 Claude Code 的多 Agent 并发协调机制，特别是其 Coordinator 模式、Agent 通信总线和任务调度系统。站在巨人的肩膀上，我们得以快速搭建起这个项目的框架。

**特别感谢:**
- **Claude Code 团队** - 开源了优秀的多 Agent 协调架构
- **核心参考文档:** `D:\claude-code-source-code-main\CORE-CODE-多 Agent 并发协调.md`
- **关键启发:** Agent 类型系统、消息总线设计、工作流模式实现

**本项目借用了前人的智慧，在此表示诚挚的感谢！** 🙇

---

## ⚠️ 项目状态

**🚧 当前阶段:** 框架搭建完成，寻求社区共建

本项目目前已完成基础架构搭建，实现了核心功能。但我们深知还有很多需要优化的地方：

### 已完成
- ✅ 基础架构搭建
- ✅ 核心功能实现 (80/80 测试通过)
- ✅ Web UI 界面
- ✅ 独立服务器模式
- ✅ 真实 OpenClaw CLI 调用

### 待优化
- ⏳ 性能优化 (并发限制、内存管理)
- ⏳ 错误处理完善
- ⏳ 日志系统改进
- ⏳ 更多 Agent 类型支持
- ⏳ 插件系统开发
- ⏳ 文档完善 (API 文档、教程)
- ⏳ 单元测试覆盖率提升
- ⏳ 用户体验优化

**我们诚挚邀请各位开发者一起参与优化，您的每一个贡献都将让这个项目变得更好！** 🤝

---

## 📖 简介

Multi-Agent Coordinator 是一个多 Agent 并行执行与可视化工具，基于 OpenClaw 构建。提供直观的 Web 界面来配置、管理和监控多个 AI Agent 的并行执行，支持流水线、并行、讨论和混合等多种工作流模式。

### ✨ 核心功能

- 🎨 **现代化 Web UI** - 基于 React + Vite 的响应式界面
- ⚡ **真实执行** - 通过独立服务器直接调用 OpenClaw CLI
- 📊 **实时监控** - 可视化展示每个 Agent 的执行状态和进度
- 🔀 **灵活工作流** - 支持 4 种工作流模式（流水线/并行/讨论/混合）
- 💬 **Agent 通信** - Agent 间可以互相发送消息协作
- 🎯 **手动干预** - 支持暂停/继续/终止 Agent，动态调整职责

---

## 🚀 快速开始

### 前置要求

- Node.js 20+ 
- OpenClaw 2026.3.28+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/yijianw/Multi-Agent-Coordinator.git
cd Multi-Agent-Coordinator

# 安装依赖
npm install
cd web-ui && npm install && cd ..
```

### 启动服务

```bash
# 终端 1: 启动独立服务器
node bin/multi-agent-server.js

# 终端 2: 启动 Web UI
cd web-ui && npm run dev
```

访问 **http://localhost:5173/** 开始使用！

---

## 🎯 功能特性

### 1. Agent 配置

- **6 种预设 Agent 类型**:
  - 👨‍💻 **Coder** - 编写高质量代码
  - 🔍 **Reviewer** - 代码审查
  - 🧪 **Tester** - 软件测试
  - 📚 **Researcher** - 信息研究
  - 📝 **Doc Writer** - 文档撰写
  - 🔧 **Custom** - 自定义角色

- **动态管理**: 随时添加/移除 Agent

### 2. 工作流模式

| 模式 | 图标 | 说明 |
|------|------|------|
| **流水线** | ➡️ | Agent 按顺序依次执行 |
| **并行** | ∥ | 所有 Agent 同时执行 |
| **讨论** | 💬 | Agent 互相交流协作 |
| **混合** | 🔀 | 自定义 DAG 工作流 |

### 3. 实时监控

- **状态卡片**: 每个 Agent 的实时状态、进度
- **动画效果**: 工作时粒子动画、完成时彩带庆祝
- **日志流**: 实时滚动显示执行日志

### 4. Agent 间通信

- **消息气泡**: 类似聊天界面的消息展示
- **消息类型**: 提问、回答、请求、建议、反馈
- **时间线视图**: 按时间顺序或按 Agent 分组查看

### 5. 手动干预

- **暂停/继续**: 随时暂停或继续 Agent 执行
- **终止**: 停止不需要的 Agent
- **修改职责**: 动态调整 Agent 的任务

---

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────┐
│       Web UI (React, 5173)          │
│  Agent Config | Workflow | Monitor  │
└───────────────┬─────────────────────┘
                │ HTTP API (JSON)
                ▼
┌─────────────────────────────────────┐
│   Independent Server (3458)         │
│  /spawn | /status | /agents        │
└───────────────┬─────────────────────┘
                │ CLI Execution
                ▼
┌─────────────────────────────────────┐
│         OpenClaw CLI                │
│  openclaw agent --session-id        │
└─────────────────────────────────────┘
```

### 核心模块

```
multi-agent-coordinator/
├── src/
│   ├── orchestrator.js       # 核心协调器
│   ├── agentFactory.js       # Agent 工厂
│   ├── messageBus.js         # 消息总线
│   └── agentController.js    # Agent 控制器
├── web-ui/
│   └── src/components/       # 14 个 UI 组件
├── bin/
│   ├── multi-agent-server.js # 独立服务器
│   └── test-*.js            # 测试脚本
└── docs/                     # 文档
```

---

## 📡 API 文档

### 独立服务器 API

#### Health Check

```bash
GET /api/health
```

**响应:**
```json
{ "status": "ok", "timestamp": 1775101234567 }
```

#### Spawn Agent

```bash
POST /api/spawn
Content-Type: application/json

{
  "task": "写一个 Hello World 程序",
  "agentId": "coder",
  "runTimeoutSeconds": 3600
}
```

**响应:**
```json
{
  "success": true,
  "sessionKey": "session-xxx",
  "message": "Agent spawned successfully"
}
```

#### Check Status

```bash
GET /api/status?sessionKey=session-xxx
```

详见 [docs/API.md](docs/API.md)

---

## 🧪 测试

### 运行测试

```bash
# 所有测试
npm test

# API 测试
node bin/test-api.js

# 集成测试
node bin/test-integration.js
```

### 测试覆盖

| 模块 | 测试数 | 通过 |
|------|--------|------|
| 核心 Skill | 8 | 8 |
| Web UI | 10 | 10 |
| 通信与持久化 | 10 | 10 |
| 高级功能 | 52 | 52 |
| **总计** | **80** | **80** |

---

## 🛠️ 开发指南

### 添加新的 Agent 类型

1. 编辑 `config.json`:
```json
{
  "agentTypes": {
    "new_type": {
      "name": "New Agent",
      "icon": "🆕",
      "basePrompt": "你的职责描述..."
    }
  }
}
```

2. 更新 `web-ui/src/components/AgentConfig.jsx`

### 自定义 UI 组件

```bash
cd web-ui
npm run dev  # 开发模式（热更新）
npm run build  # 生产构建
```

---

## 📊 性能指标

- **最大并发 Agent 数**: 10（可配置）
- **平均启动时间**: <2 秒/Agent
- **状态更新延迟**: <1 秒
- **内存占用**: ~150MB（空闲）

---

## 🤝 贡献

我们诚挚邀请各位开发者一起参与项目优化！无论大小贡献，我们都不胜感激！

### 如何贡献

1. **Fork** 本仓库
2. 创建**特性分支** (`git checkout -b feature/amazing-feature`)
3. **提交** 更改 (`git commit -m 'Add amazing feature'`)
4. **推送** 到分支 (`git push origin feature/amazing-feature`)
5. 提交 **Pull Request**

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

### 特别需要的帮助

- 📝 **文档完善** - API 文档、使用教程、示例代码
- 🧪 **测试补充** - 单元测试、集成测试、E2E 测试
- ⚡ **性能优化** - 并发控制、内存管理、响应速度
- 🎨 **UI/UX 改进** - 界面优化、用户体验提升
- 🐛 **Bug 修复** - 发现问题欢迎提交 PR
- 💡 **新功能** - Agent 类型、工作流模式、可视化组件

**您的每一个贡献都至关重要！** 🙏

---

## 📝 更新日志

### v1.0.0 (2026-04-02) - Initial Release

**新增:**
- ✅ 核心 Skill 系统
- ✅ React Web UI
- ✅ 4 种工作流模式
- ✅ Agent 间通信
- ✅ 手动干预功能
- ✅ 进度可视化
- ✅ 独立服务器模式

**已知问题:**
- ⚠️ 性能需要优化
- ⚠️ 文档不够完善
- ⚠️ 测试覆盖率待提升

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

### 灵感来源

- **[Claude Code](https://github.com/anthropics/claude-code)** - 多 Agent 并发协调架构的核心参考
  - Coordinator 模式
  - Agent 通信总线
  - 任务调度系统
  - Agent 类型系统

### 技术栈

- **[OpenClaw](https://github.com/openclaw/openclaw)** - 强大的 AI 自动化框架
- **[React](https://react.dev)** - 用于构建用户界面
- **[Vite](https://vitejs.dev)** - 下一代前端构建工具
- **[Node.js](https://nodejs.org)** - 后端运行时

### 社区

感谢所有为开源社区做出贡献的开发者！🙇

---

<div align="center">

**Made with ❤️ by the Multi-Agent Coordinator Team**

[⭐ Star this repo](https://github.com/yijianw/Multi-Agent-Coordinator) if you find it useful!

**欢迎加入我们一起优化这个项目！** 🚀

</div>
