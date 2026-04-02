# 🦞 Multi-Agent Coordinator

<div align="center">

**强大的多 Agent 并行执行与可视化工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-green.svg)](https://docs.openclaw.ai)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [架构设计](#-架构设计) • [API 文档](#-api-文档) • [开发指南](#-开发指南)

</div>

---

## 📖 简介

Multi-Agent Coordinator 是一个功能强大的多 Agent 并行执行与可视化工具，基于 OpenClaw 构建。它提供了直观的 Web 界面来配置、管理和监控多个 AI Agent 的并行执行，支持流水线、并行、讨论和混合等多种工作流模式。

### ✨ 核心亮点

- 🎨 **现代化 Web UI** - 基于 React + Vite 的响应式界面
- ⚡ **实时执行** - 通过独立服务器直接调用 OpenClaw CLI
- 📊 **实时监控** - 可视化展示每个 Agent 的执行状态和进度
- 🔀 **灵活工作流** - 支持 4 种工作流模式（流水线/并行/讨论/混合）
- 💬 **Agent 通信** - Agent 间可以互相发送消息协作
- 📈 **进度可视化** - 甘特图、进度统计、状态动画
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
git clone https://github.com/YOUR_USERNAME/multi-agent-coordinator.git
cd multi-agent-coordinator

# 安装依赖
npm install

# 安装 Web UI 依赖
cd web-ui
npm install
cd ..
```

### 启动服务

#### 方式 1: 独立服务器模式（推荐）

```bash
# 终端 1: 启动独立服务器
node bin/multi-agent-server.js

# 终端 2: 启动 Web UI
cd web-ui
npm run dev
```

访问 **http://localhost:5173/** 开始使用！

#### 方式 2: Skill 模式

```bash
# 启动 OpenClaw（如果未运行）
openclaw gateway start

# Skill 会自动加载
```

---

## 🎯 功能特性

### 1. Agent 配置

<div align="center">
  <img src="docs/screenshots/agent-config.png" alt="Agent Configuration" width="600"/>
</div>

- **6 种预设 Agent 类型**:
  - 👨‍💻 **Coder** - 编写高质量代码
  - 🔍 **Reviewer** - 代码审查
  - 🧪 **Tester** - 软件测试
  - 📚 **Researcher** - 信息研究
  - 📝 **Doc Writer** - 文档撰写
  - 🔧 **Custom** - 自定义角色

- **功能强化**: 为每个 Agent 添加特殊要求
- **动态管理**: 随时添加/移除 Agent

### 2. 工作流模式

<div align="center">
  <img src="docs/screenshots/workflow-modes.png" alt="Workflow Modes" width="600"/>
</div>

| 模式 | 图标 | 说明 | 适用场景 |
|------|------|------|----------|
| **流水线** | ➡️ | Agent 按顺序依次执行 | 研究→编码→审查→测试 |
| **并行** | ∥ | 所有 Agent 同时执行 | 独立任务，需要快速完成 |
| **讨论** | 💬 | Agent 互相交流协作 | 复杂问题，需要集思广益 |
| **混合** | 🔀 | 自定义 DAG 工作流 | 复杂的多阶段任务 |

### 3. 实时监控

<div align="center">
  <img src="docs/screenshots/monitoring.png" alt="Real-time Monitoring" width="600"/>
</div>

- **状态卡片**: 每个 Agent 的实时状态、进度、统计数据
- **动画效果**: 工作时粒子动画、完成时彩带庆祝
- **日志流**: 实时滚动显示执行日志

### 4. Agent 间通信

<div align="center">
  <img src="docs/screenshots/discussion.png" alt="Agent Communication" width="600"/>
</div>

- **消息气泡**: 类似聊天界面的消息展示
- **消息类型**: 提问、回答、请求、建议、反馈
- **时间线视图**: 按时间顺序或按 Agent 分组查看

### 5. 手动干预

<div align="center">
  <img src="docs/screenshots/intervention.png" alt="Manual Intervention" width="600"/>
</div>

- **暂停/继续**: 随时暂停或继续 Agent 执行
- **终止**: 停止不需要的 Agent
- **修改职责**: 动态调整 Agent 的任务
- **优先级调整**: 低/普通/高/紧急

### 6. 进度可视化

<div align="center">
  <img src="docs/screenshots/gantt.png" alt="Gantt Chart" width="600"/>
</div>

- **甘特图**: 可视化展示任务时间线和依赖关系
- **进度统计**: 整体进度、完成率、效率指标
- **里程碑**: 标记关键节点

---

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────┐
│                  Web UI (React)                     │
│                   Port: 5173                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │Agent Config │  │  Workflow   │  │   Monitor   │ │
│  │             │  │  Selector   │  │   Panel     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP API (JSON)
                      ▼
┌─────────────────────────────────────────────────────┐
│            Independent Server (Node.js)             │
│                   Port: 3458                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   /spawn    │  │   /status   │  │   /agents   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │ CLI Execution
                      ▼
┌─────────────────────────────────────────────────────┐
│                  OpenClaw CLI                       │
│         openclaw agent --session-id "xxx"           │
│              --message "task" --thinking            │
└─────────────────────────────────────────────────────┘
```

### 核心模块

```
multi-agent-coordinator/
├── src/
│   ├── index.js              # Skill 入口（兼容模式）
│   ├── orchestrator.js       # 核心协调器
│   ├── agentFactory.js       # Agent 工厂
│   ├── messageBus.js         # 消息总线
│   └── agentController.js    # Agent 控制器
├── web-ui/
│   ├── src/
│   │   ├── App.jsx           # 主应用
│   │   └── components/       # UI 组件
│   │       ├── AgentConfig.jsx
│   │       ├── WorkflowSelector.jsx
│   │       ├── MonitorPanel.jsx
│   │       ├── DagEditor.jsx
│   │       ├── MessageTimeline.jsx
│   │       └── ...
│   └── dist/                 # 构建输出
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
{
  "status": "ok",
  "timestamp": 1775101234567
}
```

#### Spawn Agent

```bash
POST /api/spawn
Content-Type: application/json

{
  "task": "写一个 Hello World 程序",
  "agentId": "coder",
  "model": "bailian/qwen3.5-plus",
  "runTimeoutSeconds": 3600
}
```

**响应:**
```json
{
  "success": true,
  "sessionKey": "session-1775101234567-abc123",
  "message": "Agent spawned successfully"
}
```

#### Check Status

```bash
GET /api/status?sessionKey=session-xxx
```

**响应:**
```json
{
  "sessionKey": "session-xxx",
  "status": "running",
  "progress": 50,
  "messagesSent": 1,
  "messagesReceived": 1,
  "duration": 30000,
  "output": "任务执行中..."
}
```

#### Get All Agents

```bash
GET /api/agents
```

**响应:**
```json
{
  "agents": [
    {
      "sessionKey": "session-xxx",
      "status": "completed",
      "progress": 100,
      "output": "任务完成"
    }
  ]
}
```

---

## 🧪 测试

### 运行测试

```bash
# API 测试
node bin/test-api.js

# 前端连接测试
node bin/test-frontend-connection.js

# 集成测试
node bin/test-integration.js

# 组件测试
node bin/test-agent-status-animation.js
```

### 测试覆盖率

| 模块 | 测试数 | 通过 | 覆盖率 |
|------|--------|------|--------|
| 核心 Skill | 8 | 8 | 100% |
| Web UI | 10 | 10 | 100% |
| 通信与持久化 | 10 | 10 | 100% |
| 高级功能 | 52 | 52 | 100% |
| **总计** | **80** | **80** | **100%** |

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
      "basePrompt": "你的职责描述...",
      "allowedTools": ["read", "write", "exec"],
      "defaultModel": "bailian/qwen3.5-plus"
    }
  }
}
```

2. 更新 `web-ui/src/components/AgentConfig.jsx` 的默认类型列表

### 添加新的工作流模式

1. 编辑 `config.json`:

```json
{
  "workflowModes": {
    "custom": {
      "name": "自定义",
      "description": "自定义工作流",
      "icon": "🎨"
    }
  }
}
```

2. 在 `orchestrator.js` 中实现执行逻辑

### 自定义 UI 组件

```bash
cd web-ui
npm run dev  # 开发模式（热更新）
npm run build  # 生产构建
```

---

## 📊 性能指标

### 并发能力

- **最大并发 Agent 数**: 10（可配置）
- **平均启动时间**: <2 秒/Agent
- **状态更新延迟**: <1 秒
- **内存占用**: ~150MB（空闲）

### 扩展性

- **水平扩展**: 支持多个独立服务器实例
- **垂直扩展**: 支持更多 Agent 类型和工作流
- **插件系统**: 计划中

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork** 本仓库
2. 创建**特性分支** (`git checkout -b feature/amazing-feature`)
3. **提交** 更改 (`git commit -m 'Add amazing feature'`)
4. **推送** 到分支 (`git push origin feature/amazing-feature`)
5. 提交 **Pull Request**

### 开发环境设置

```bash
# 克隆你的 fork
git clone https://github.com/YOUR_USERNAME/multi-agent-coordinator.git
cd multi-agent-coordinator

# 安装依赖
npm install
cd web-ui && npm install && cd ..

# 启动开发服务器
node bin/multi-agent-server.js
# 新终端
cd web-ui && npm run dev
```

### 代码规范

- 使用 ESLint 和 Prettier
- 编写单元测试
- 提交信息遵循 Conventional Commits

---

## 📝 更新日志

### v1.0.0 (2026-04-02)

**新增:**
- ✅ 核心 Skill 系统
- ✅ React Web UI
- ✅ 4 种工作流模式
- ✅ Agent 间通信
- ✅ 手动干预功能
- ✅ 进度可视化
- ✅ 独立服务器模式

**修复:**
- 🐛 Skill 权限问题 → 独立服务器方案
- 🐛 CLI 参数问题 → 添加 --session-id
- 🐛 前端轮询问题 → 修复闭包问题

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - 强大的 AI 自动化框架
- [React](https://react.dev) - 用于构建用户界面
- [Vite](https://vitejs.dev) - 下一代前端构建工具
- [Claude Code](https://github.com/anthropics/claude-code) - 多 Agent 架构参考

---

<div align="center">

**Made with ❤️ by the Multi-Agent Coordinator Team**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/multi-agent-coordinator) if you find it useful!

</div>
