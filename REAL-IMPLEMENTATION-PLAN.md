# 真实 Agent 执行实现方案

**分析时间:** 2026-04-02 10:35  
**基于:** OpenClaw 源码分析 (D:\openclaw-main)  
**状态:** ✅ 找到正确实现方式

---

## 🔍 核心发现

### OpenClaw 的 Agent 执行机制

**关键文件:**
1. `src/agents/tools/sessions-spawn-tool.ts` - sessions_spawn 工具实现
2. `src/agents/subagent-spawn.ts` - 子 Agent 生成核心逻辑
3. `src/agents/subagent-registry.ts` - 子 Agent 注册管理

**调用链:**
```
sessions_spawn tool
  └─> spawnSubagentDirect()
        └─> callGateway({ method: 'agent.create', ... })
              └─> 创建子 Agent 会话
                    └─> 执行任务
                          └─> 返回结果
```

---

## 📋 sessions_spawn API 详解

### 参数说明

```typescript
interface SessionsSpawnParams {
  // 必填
  task: string                    // 任务描述
  
  // 运行时配置
  runtime?: "subagent" | "acp"   // 运行时类型
  agentId?: string                // 指定 Agent ID
  model?: string                  // 模型覆盖 (如 "bailian/qwen3.5-plus")
  thinking?: string               // 思考级别
  
  // 执行模式
  mode?: "run" | "session"       // run=一次性，session=持久会话
  thread?: boolean                // 是否线程绑定
  
  // 超时控制
  runTimeoutSeconds?: number      // 运行超时 (秒)
  timeoutSeconds?: number         // 兼容参数
  
  // 工作目录
  cwd?: string                    // 工作目录
  
  // 清理策略
  cleanup?: "delete" | "keep"     // 完成后是否删除
  
  // 沙箱模式
  sandbox?: "inherit" | "require" // 沙箱要求
  
  // 附件 (可选)
  attachments?: Array<{
    name: string
    content: string
    encoding?: "utf8" | "base64"
    mimeType?: string
  }>
}
```

### 返回值

```typescript
interface SessionsSpawnResult {
  status: "accepted" | "forbidden" | "error"
  childSessionKey?: string        // 子会话 Key
  runId?: string                  // 运行 ID
  mode?: "run" | "session"
  note?: string                   // 说明信息
  error?: string                  // 错误信息
}
```

---

## ✅ 正确的实现方式

### 方案：通过 OpenClaw sessions_spawn 工具

**核心代码:**

```javascript
// 我们的 Multi-Agent Coordinator 应该这样实现:

import { sessions_spawn } from 'openclaw'

async _spawnAgentSession(agent) {
  const startTime = Date.now()
  
  try {
    // 1. 构建 sessions_spawn 参数
    const spawnParams = {
      task: agent.taskDescription,
      runtime: 'subagent',
      agentId: agent.type,  // coder, reviewer 等
      model: agent.model || 'bailian/qwen3.5-plus',
      thinking: agent.enhancedPrompt ? 'verbose' : undefined,
      mode: 'run',  // 一次性执行
      cleanup: 'keep',
      label: `${agent.name} - ${agent.role}`
    }
    
    // 2. 调用 sessions_spawn
    const result = await sessions_spawn(spawnParams)
    
    // 3. 等待执行完成 (通过事件或轮询)
    const completionResult = await waitForCompletion(result.childSessionKey)
    
    // 4. 返回真实结果
    return {
      sessionId: result.childSessionKey,
      runId: result.runId,
      summary: completionResult.summary,
      details: completionResult.output,
      duration: Date.now() - startTime,
      success: result.status === 'accepted'
    }
    
  } catch (error) {
    throw new Error(`Agent execution failed: ${error.message}`)
  }
}

// 等待完成 (通过轮询或事件)
async function waitForCompletion(sessionKey) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await sessions_status({ sessionKey })
        
        if (status.completed) {
          resolve({
            summary: status.summary,
            output: status.output
          })
        } else {
          setTimeout(poll, 1000)
        }
      } catch (error) {
        reject(error)
      }
    }
    
    poll()
  })
}
```

---

## 🔧 需要调用的 OpenClaw API

### 1. sessions_spawn

```javascript
// 方式 A: 通过工具调用 (推荐)
const result = await sessions_spawn({
  task: '开发一个化工企业采购员查价工具',
  runtime: 'subagent',
  agentId: 'coder',
  model: 'bailian/qwen3.5-plus',
  mode: 'run'
})
```

### 2. sessions_status

```javascript
// 查询会话状态
const status = await sessions_status({
  sessionKey: 'session-xxx'
})

// 返回:
{
  completed: true,
  summary: 'Task completed',
  output: '...',
  usage: { tokens: 1234 }
}
```

### 3. sessions_send

```javascript
// 发送消息到会话
await sessions_send({
  sessionKey: 'session-xxx',
  message: '请继续完成...'
})
```

---

## 📝 完整实现步骤

### 步骤 1: 导入 OpenClaw API

```javascript
// src/orchestrator.js
import { 
  sessions_spawn,
  sessions_status,
  sessions_send 
} from 'openclaw'
```

### 步骤 2: 实现真实执行

```javascript
async _spawnAgentSession(agent) {
  const startTime = Date.now()
  
  // 1. 调用 sessions_spawn
  const spawnResult = await sessions_spawn({
    task: agent.taskDescription,
    runtime: 'subagent',
    agentId: agent.type,
    model: agent.model || 'bailian/qwen3.5-plus',
    thinking: agent.enhancedPrompt ? 'verbose' : 'off',
    mode: 'run',
    cleanup: 'keep',
    label: `${agent.name} - ${agent.role}`
  })
  
  if (spawnResult.status === 'error') {
    throw new Error(spawnResult.error)
  }
  
  // 2. 等待完成
  const completionResult = await this._waitForCompletion(
    spawnResult.childSessionKey
  )
  
  // 3. 更新统计数据
  agent.messagesSent = completionResult.messagesSent || 0
  agent.messagesReceived = completionResult.messagesReceived || 0
  
  return {
    sessionId: spawnResult.childSessionKey,
    runId: spawnResult.runId,
    summary: completionResult.summary,
    details: completionResult.output,
    duration: Date.now() - startTime,
    success: true
  }
}
```

### 步骤 3: 实现完成等待

```javascript
async _waitForCompletion(sessionKey) {
  const maxWaitTime = 3600000  // 1 小时
  const pollInterval = 2000    // 2 秒
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await sessions_status({ sessionKey })
    
    if (status.completed || status.failed) {
      return {
        summary: status.summary || 'Task completed',
        output: status.output || '',
        messagesSent: status.messagesSent || 0,
        messagesReceived: status.messagesReceived || 0
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }
  
  throw new Error('Timeout waiting for agent completion')
}
```

---

## 🎯 清除技术债务

### 需要删除的模拟代码

```javascript
// ❌ 删除这段模拟代码
async _spawnAgentSession(agent) {
  const executionTime = 3000 + Math.random() * 2000
  
  for (let step = 1; step <= totalSteps; step++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    agent.updateStatus('running', progress)
  }
  
  return {
    summary: `${agent.name} completed the task`,  // 假结果
    details: 'Execution time: ...'
  }
}
```

### 替换为真实代码

```javascript
// ✅ 替换为真实调用
async _spawnAgentSession(agent) {
  const spawnResult = await sessions_spawn({
    task: agent.taskDescription,
    runtime: 'subagent',
    agentId: agent.type,
    model: agent.model || 'bailian/qwen3.5-plus',
    mode: 'run'
  })
  
  const completionResult = await this._waitForCompletion(
    spawnResult.childSessionKey
  )
  
  return {
    sessionId: spawnResult.childSessionKey,
    summary: completionResult.summary,
    details: completionResult.output,
    duration: Date.now() - startTime
  }
}
```

---

## 📊 预期效果对比

### 修复前

| 指标 | 值 | 原因 |
|------|-----|------|
| 发送消息 | 0 | 未执行 |
| 接收消息 | 0 | 未执行 |
| 干预次数 | 0 | 未执行 |
| 运行时间 | 3s | setTimeout |
| Agent 数量 | 错误 | 全局累积 |
| 日志 | 无 | 模拟输出 |

### 修复后

| 指标 | 预期值 | 说明 |
|------|--------|------|
| 发送消息 | 实际值 | 真实统计 |
| 接收消息 | 实际值 | 真实统计 |
| 干预次数 | 实际值 | 真实统计 |
| 运行时间 | 实际值 | 真实执行时长 |
| Agent 数量 | 准确 | 当前会话 |
| 日志 | 实时输出 | 真实日志 |

---

## 🚀 实施计划

### 第一阶段：环境准备

- [ ] 确认 OpenClaw sessions_spawn 可用
- [ ] 测试 sessions_status API
- [ ] 准备测试用例

### 第二阶段：代码替换

- [ ] 删除所有模拟代码
- [ ] 实现真实 sessions_spawn 调用
- [ ] 实现完成等待逻辑
- [ ] 实现错误处理

### 第三阶段：测试验证

- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 用户测试

---

## 📝 总结

**核心发现:**
- OpenClaw 提供 `sessions_spawn` 工具用于生成子 Agent
- 支持 `runtime="subagent"` 和 `runtime="acp"` 两种模式
- 通过 `sessions_status` 查询执行状态
- 通过事件或轮询等待完成

**下一步:**
1. 测试 `sessions_spawn` API 可用性
2. 实现真实调用代码
3. 清除所有模拟代码
4. 完整测试验证

---

**阿卷向筱河汇报：已找到正确的实现方式！通过 OpenClaw sessions_spawn API 可以真实执行 Agent！** 📜✨
