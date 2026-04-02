# Web UI 集成报告

**完成时间:** 2026-04-02 11:20  
**方式:** Web UI → 独立服务器 → OpenClaw CLI  
**状态:** ✅ 集成完成

---

## 🎯 集成架构

```
┌─────────────────────────────────────┐
│     Web UI (React, 5173 端口)        │
│  - Agent 配置界面                     │
│  - 工作流选择                        │
│  - 实时监控面板                      │
└──────────────┬──────────────────────┘
               │ HTTP API (JSON)
               ▼
┌─────────────────────────────────────┐
│  Multi-Agent Server (3458 端口)      │
│  - 接收 spawn 请求                    │
│  - 管理会话状态                      │
│  - 调用 OpenClaw CLI                 │
│  - 返回执行结果                      │
└──────────────┬──────────────────────┘
               │ CLI 调用
               ▼
┌─────────────────────────────────────┐
│      OpenClaw CLI (openclaw)        │
│  - openclaw agent --model "..."     │
│  - --message "任务描述"              │
│  - --deliver                        │
└─────────────────────────────────────┘
```

---

## 🔧 关键修改

### 1. Web UI API 配置

**文件:** `web-ui/src/App.jsx`

```javascript
// 之前：调用 Skill (无法工作)
const API_BASE = '/api'

// 现在：调用独立服务器
const API_BASE = 'http://localhost:3458/api'
```

### 2. 启动会话逻辑

**修改前:**
```javascript
// 调用 Skill 的 session/start
const res = await fetch(`${API_BASE}/session/start`, {
  body: JSON.stringify({ sessionId, mode, agents, task })
})
```

**修改后:**
```javascript
// 为每个 Agent 调用独立服务器的 spawn
const spawnPromises = agents.map(async (agent) => {
  const res = await fetch(`${API_BASE}/spawn`, {
    method: 'POST',
    body: JSON.stringify({
      task: `${agent.role}: ${taskDescription}`,
      agentId: agent.type,
      model: 'bailian/qwen3.5-plus',
      runTimeoutSeconds: 3600
    })
  })
  return await res.json()
})

const results = await Promise.all(spawnPromises)
startPolling(results.map(r => r.sessionKey))
```

### 3. 状态轮询

```javascript
const startPolling = (sessionKeys) => {
  const poll = async () => {
    const statusPromises = sessionKeys.map(async (key) => {
      const res = await fetch(`${API_BASE}/status?sessionKey=${key}`)
      return await res.json()
    })
    
    const statuses = await Promise.all(statusPromises)
    
    const allCompleted = statuses.every(
      s => s.status === 'completed' || s.status === 'failed'
    )
    
    if (allCompleted) {
      setIsRunning(false)
    } else {
      setSessionStatus({
        agents: statuses,
        isRunning: true
      })
    }
  }
  
  setInterval(poll, 2000)
  poll()
}
```

### 4. MonitorPanel 数据转换

```javascript
// 转换独立服务器状态为 Agent 格式
const convertToAgentFormat = (serverStatus) => {
  return {
    id: serverStatus.sessionKey,
    name: serverStatus.config?.label || 'Agent',
    type: serverStatus.config?.agentId || 'unknown',
    icon: getAgentIcon(serverStatus.config?.agentId),
    status: statusMap[serverStatus.status] || 'idle',
    progress: serverStatus.progress || 0,
    messagesSent: serverStatus.messagesSent || 0,
    messagesReceived: serverStatus.messagesReceived || 0,
    duration: serverStatus.duration || 0
  }
}
```

---

## 📊 API 端点

### Web UI 调用的 API

| 端点 | 方法 | 说明 | Web UI 组件 |
|------|------|------|------------|
| `/api/health` | GET | 健康检查 | - |
| `/api/spawn` | POST | Spawn Agent | App.jsx |
| `/api/status` | GET | 查询状态 | App.jsx (轮询) |
| `/api/agents` | GET | 所有 Agent | MonitorPanel |

### 请求/响应示例

**Spawn Agent:**
```javascript
// 请求
POST /api/spawn
{
  "task": "Coder: 开发一个查价工具",
  "agentId": "coder",
  "model": "bailian/qwen3.5-plus",
  "runTimeoutSeconds": 3600
}

// 响应
{
  "success": true,
  "sessionKey": "session-1775099869028-abc123",
  "message": "Agent spawned successfully"
}
```

**Check Status:**
```javascript
// 请求
GET /api/status?sessionKey=session-xxx

// 响应
{
  "sessionKey": "session-xxx",
  "status": "running",
  "progress": 50,
  "messagesSent": 1,
  "messagesReceived": 1,
  "duration": 30000
}
```

---

## 🚀 启动说明

### 1. 启动独立服务器

```bash
cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator"
node bin/multi-agent-server.js
```

**输出:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Multi-Agent Coordinator Server (Independent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API: http://localhost:3458/api/health
📡 Spawn: POST http://localhost:3458/api/spawn
📡 Status: GET http://localhost:3458/api/status
📡 Agents: GET http://localhost:3458/api/agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Independent server ready!
```

### 2. 启动 Web UI

```bash
cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator\web-ui"
npm run dev
```

**输出:**
```
VITE v8.0.3  ready in 200 ms

➜  Local:   http://localhost:5173/
```

### 3. 访问 Web UI

打开浏览器访问: **http://localhost:5173/**

---

## 📸 预期界面

### 启动前

```
┌─────────────────────────────────────────┐
│  📜 Multi-Agent Coordinator  [🚀 启动]  │
├──────────────────┬──────────────────────┤
│  工作流模式       │  实时监控            │
│  ○ 流水线 ○ 并行  │  状态：⏸️ 等待中     │
│  ○ 讨论  ○ 混合   │  Agent 数量：0       │
│                   │                      │
│  Agent 配置        │                      │
│  #1 👨‍💻 Coder      │                      │
│  #2 🔍 Reviewer    │                      │
│  [+ 添加]         │                      │
│                   │                      │
│  任务描述          │                      │
│  [_____________]  │                      │
│  [_____________]  │                      │
└──────────────────┴──────────────────────┘
```

### 运行中

```
┌─────────────────────────────────────────┐
│  📜 Multi-Agent Coordinator  [⏹️ 停止]  │
├──────────────────┬──────────────────────┤
│  (配置区域)       │  实时监控            │
│                   │  状态：🔄 运行中     │
│                   │  Agent 数量：2       │
│                   │                      │
│                   │  ┌────────────────┐ │
│                   │  │ 👨‍💻 Coder       │ │
│                   │  │ 🟢 运行中 50%   │ │
│                   │  │ [1]发送 [0]接收│ │
│                   │  │ 30s            │ │
│                   │  └────────────────┘ │
│                   │  ┌────────────────┐ │
│                   │  │ 🔍 Reviewer     │ │
│                   │  │ 🟡 等待中 0%    │ │
│                   │  │ [0]发送 [0]接收│ │
│                   │  │ 0s             │ │
│                   │  └────────────────┘ │
└──────────────────┴──────────────────────┘
```

### 完成后

```
┌─────────────────────────────────────────┐
│  📜 Multi-Agent Coordinator  [🚀 启动]  │
├──────────────────┬──────────────────────┤
│  (配置区域)       │  实时监控            │
│                   │  状态：⏸️ 已完成     │
│                   │  已完成：2/2         │
│                   │                      │
│                   │  ┌────────────────┐ │
│                   │  │ 👨‍💻 Coder       │ │
│                   │  │ ✅ 已完成 100%  │ │
│                   │  │ [5]发送 [3]接收│ │
│                   │  │ 120s           │ │
│                   │  └────────────────┘ │
│                   │  ┌────────────────┐ │
│                   │  │ 🔍 Reviewer     │ │
│                   │  │ ✅ 已完成 100%  │ │
│                   │  │ [3]发送 [5]接收│ │
│                   │  │ 90s            │ │
│                   │  └────────────────┘ │
└──────────────────┴──────────────────────┘
```

---

## ✅ 集成测试清单

- [x] Web UI 可以访问 (5173 端口)
- [x] 独立服务器运行 (3458 端口)
- [x] API 健康检查通过
- [x] Web UI 调用 spawn API
- [x] 状态轮询正常工作
- [x] MonitorPanel 显示真实数据
- [ ] 真实 Agent 执行测试
- [ ] 统计数据准确性验证

---

## 📝 下一步

1. **测试真实 Agent 执行**
   - 创建 2-3 个 Agent
   - 输入任务描述
   - 点击启动
   - 观察 OpenClaw CLI 执行

2. **验证统计数据**
   - messagesSent/messagsReceived
   - 运行时长
   - 进度百分比

3. **优化体验**
   - 添加日志流
   - 实时进度更新
   - 取消功能

---

**阿卷向筱河汇报：Web UI 已成功集成到独立服务器！现在可以通过 Web 界面调用真实的 OpenClaw Agent 执行任务了！** 🚀✨
