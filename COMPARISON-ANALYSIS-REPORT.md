# 多 Agent 协作体系对比分析报告

**分析时间:** 2026-04-02 10:25  
**分析者:** 阿卷 📜  
**对比对象:** 
- 我们的项目 (Multi-Agent Coordinator)
- Claude Code (D:\claude-code-source-code-main)

---

## 📊 核心架构对比

### 1. 项目定位差异

| 维度 | 我们的项目 | Claude Code |
|------|-----------|-------------|
| **定位** | OpenClaw Skill/插件 | 独立 CLI 应用 |
| **运行环境** | OpenClaw 会话内 | 独立 Node.js 进程 |
| **Agent 执行** | 依赖 OpenClaw sessions_spawn | 直接调用 Anthropic API |
| **权限模型** | 继承 OpenClaw 权限 | 独立权限系统 |

**关键差异:**
- Claude Code 是**独立应用**，可以直接 spawn 子进程
- 我们的项目是**OpenClaw Skill**，必须通过 OpenClaw 提供的 API

---

## 🔍 核心代码对比

### 2. Agent 执行逻辑对比

#### Claude Code 的实现

**文件:** `src/tools/AgentTool/runAgent.ts`

```typescript
export async function runAgent(
  agentDefinition: AgentDefinition,
  promptMessages: Message[],
  toolUseContext: ToolUseContext
): AsyncGenerator<Message, void> {
  // 1. 创建唯一 Agent ID
  const agentId = createAgentId()
  
  // 2. 构建系统提示
  const systemPrompt = enhanceSystemPromptWithEnvDetails(
    agentDefinition.getSystemPrompt()
  )
  
  // 3. 获取工具列表
  const { resolvedTools } = resolveAgentTools(...)
  
  // 4. 连接 MCP 服务器
  const mcpClients = await initializeAgentMcpServers(...)
  
  // 5. 实际调用 API 执行
  for await (const message of query(
    systemPrompt,
    promptMessages,
    resolvedTools,
    model,
    ...
  )) {
    yield message  // 实时流式返回
  }
  
  // 6. 记录元数据
  await writeAgentMetadata(agentId, {...})
}
```

**核心调用链:**
```
runAgent()
  └─> query()  ← 实际调用 Anthropic API
        └─> stream()  ← 流式响应
              └─> yield message  ← 实时返回
```

**关键点:**
- ✅ **真实 API 调用** - `query()` 函数直接调用 Anthropic API
- ✅ **流式返回** - `AsyncGenerator` 实时返回消息
- ✅ **完整上下文** - 包含系统提示、工具、MCP 服务器
- ✅ **持久化** - 写入元数据和转录记录

---

#### 我们的实现

**文件:** `src/orchestrator.js`

```javascript
async _executeAgent(agent, options = {}) {
  try {
    agent.updateStatus('running', 0)
    
    // ❌ 问题所在：调用模拟函数
    const sessionResult = await this._spawnAgentSession(agent)
    
    agent.result = {
      summary: sessionResult.summary,
      details: sessionResult.details
    }
    
    agent.updateStatus('completed', 100)
  } catch (error) {
    agent.updateStatus('failed', 0)
  }
}

async _spawnAgentSession(agent) {
  // ❌ 纯模拟执行
  const executionTime = 3000 + Math.random() * 2000
  
  for (let step = 1; step <= totalSteps; step++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    agent.updateStatus('running', progress)
  }
  
  return {
    summary: `${agent.name} completed the task`,
    duration: Date.now() - startTime
  }
}
```

**调用链:**
```
_executeAgent()
  └─> _spawnAgentSession()  ← 模拟函数
        └─> setTimeout  ← 假等待
              └─> 返回假结果
```

**问题点:**
- ❌ **没有真实调用** - 只是 setTimeout 模拟
- ❌ **没有 API 调用** - 不调用 OpenClaw sessions_spawn
- ❌ **没有流式返回** - 一次性返回假结果
- ❌ **没有持久化** - 不记录任何元数据

---

### 3. 为什么我们做了虚假模拟？

#### 根本原因分析

**1. 环境限制**

```javascript
// Claude Code 可以这样做:
import { query } from '../../query.js'  // 直接调用 API

// 我们不行，因为:
// - 我们是 OpenClaw Skill，不是独立应用
// - 我们没有直接访问 Anthropic API 的权限
// - 我们必须通过 OpenClaw 的 sessions_spawn
```

**2. 技术债务**

```javascript
// 代码中的注释暴露了问题:
// ❌ "这里需要通过 OpenClaw 的 API 或工具调用"
// ❌ "由于当前环境限制，我们先模拟真实执行过程"

// 这说明:
// 1. 开发者知道需要真实调用
// 2. 但不知道如何调用 OpenClaw API
// 3. 用模拟来"先让界面跑起来"
```

**3. OpenClaw sessions_spawn 调用困难**

```javascript
// 理想情况下应该这样:
import { sessions_spawn } from 'openclaw'

const result = await sessions_spawn({
  task: agent.taskDescription,
  model: agent.model,
  agentId: 'coder'
})

// 但实际上:
// 1. sessions_spawn 是 OpenClaw 内部 API
// 2. 不对外暴露给 Skill
// 3. 需要通过特定方式调用
```

---

## 🔧 Claude Code 核心机制详解

### 4. query() 函数分析

**文件:** `src/query.ts`

```typescript
export async function* query(
  systemPrompt: SystemPrompt,
  promptMessages: Message[],
  tools: Tools,
  model: ModelAlias,
  // ... 更多参数
): AsyncGenerator<Message, void> {
  
  // 1. 准备 API 请求
  const messages = normalizeMessagesForAPI(promptMessages)
  
  // 2. 调用 Anthropic API
  const response = await anthropic.messages.create({
    model,
    system: systemPrompt,
    messages,
    tools: serializeTools(tools),
    stream: true  // 流式响应
  })
  
  // 3. 处理流式响应
  for await (const event of response) {
    if (event.type === 'content_block_delta') {
      yield {
        type: 'assistant',
        content: event.delta.text
      }
    }
  }
  
  // 4. 处理工具调用
  const toolResults = await runTools(...)
  for (const result of toolResults) {
    yield result
  }
}
```

**关键点:**
- ✅ 直接调用 `anthropic.messages.create()`
- ✅ 流式处理 `for await (const event of response)`
- ✅ 工具执行 `runTools()`
- ✅ 实时 `yield` 返回

---

### 5. Task 管理系统

**文件:** `src/Task.ts`

```typescript
export type TaskType =
  | 'local_bash'       // 本地 Bash
  | 'local_agent'      // 本地 Agent
  | 'remote_agent'     // 远程 Agent
  | 'in_process_teammate'  // 队友
  | 'local_workflow'   // 工作流
  | 'monitor_mcp'      // MCP 监控
  | 'dream'            // 梦想模式

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'killed'

export function generateTaskId(type: TaskType): string {
  const prefix = TASK_ID_PREFIXES[type]  // 'a' for agent
  const bytes = randomBytes(8)
  // 生成唯一 ID: a1b2c3d4e5
}
```

**任务管理:**
- ✅ 每种任务类型有唯一前缀
- ✅ 状态机管理 (pending→running→completed/failed)
- ✅ 唯一 ID 生成
- ✅ 输出文件路径管理

---

## 📋 我们的问题清单

### 6. 核心问题总结

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| **没有真实调用** | 🔴 严重 | 只是 setTimeout 模拟 |
| **没有 API 集成** | 🔴 严重 | 未调用 OpenClaw sessions_spawn |
| **没有流式返回** | 🟡 中等 | 一次性返回假结果 |
| **没有持久化** | 🟡 中等 | 不记录元数据 |
| **统计数据虚假** | 🟡 中等 | 都是 0 或假值 |
| **日志虚假** | 🟡 中等 | 模拟输出 |

---

## ✅ 修复方案

### 7. 如何真正实现 Agent 执行

#### 方案 A: 通过 OpenClaw sessions_send (推荐)

```javascript
// 使用 sessions_send 调用 OpenClaw
import { sessions_send } from 'openclaw'

async _spawnAgentSession(agent) {
  const startTime = Date.now()
  
  // 1. 构建任务
  const task = {
    task: agent.taskDescription,
    model: agent.model || 'qwen3.5-plus',
    thinking: agent.enhancedPrompt
  }
  
  // 2. 发送任务到 OpenClaw
  const result = await sessions_send({
    message: JSON.stringify(task),
    timeoutSeconds: 3600
  })
  
  // 3. 处理结果
  return {
    sessionId: agent.id,
    summary: result.summary,
    details: result.details,
    duration: Date.now() - startTime,
    output: result.output
  }
}
```

#### 方案 B: 通过 HTTP 调用 OpenClaw API

```javascript
// 如果 OpenClaw 有 HTTP API
async _spawnAgentSession(agent) {
  const response = await fetch('http://localhost:8080/api/spawn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: agent.taskDescription,
      model: agent.model,
      type: agent.type
    })
  })
  
  const result = await response.json()
  return result
}
```

#### 方案 C: 通过子进程调用 Claude Code

```javascript
// 直接调用 Claude Code CLI
import { spawn } from 'child_process'

async _spawnAgentSession(agent) {
  return new Promise((resolve) => {
    const child = spawn('claude', [
      agent.taskDescription,
      '--model', agent.model
    ])
    
    let output = ''
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.on('close', (code) => {
      resolve({
        summary: 'Task completed',
        details: output,
        duration: Date.now() - startTime
      })
    })
  })
}
```

---

## 🎯 行动计划

### 8. 修复优先级

**第一阶段：理解 OpenClaw API**
- [ ] 研究 OpenClaw sessions_spawn API
- [ ] 研究 OpenClaw sessions_send API
- [ ] 确认调用权限和限制

**第二阶段：实现真实调用**
- [ ] 替换 `_spawnAgentSession` 为真实调用
- [ ] 实现流式返回
- [ ] 实现错误处理

**第三阶段：完善功能**
- [ ] 实现持久化
- [ ] 实现统计
- [ ] 实现日志

---

## 📝 结论

**为什么之前做虚假模拟？**

1. **不知道如何调用 OpenClaw API** - 文档不足
2. **想让界面先跑起来** - 演示目的
3. **技术债务积累** - 越积越多

**为什么达不到 Claude Code 效果？**

1. **架构差异** - Skill vs 独立应用
2. **API 访问** - 无直接 API 访问
3. **执行环境** - 依赖 OpenClaw

**如何解决？**

1. **研究 OpenClaw API** - 找到正确调用方式
2. **实现真实调用** - 替换模拟代码
3. **完善错误处理** - 健壮性

---

**阿卷向筱河汇报：已完成对比分析，找到问题根源！下一步需要研究 OpenClaw API 并实现真实调用！** 📜
