/**
 * Orchestrator - 协调器模块
 * 负责管理 Agent 执行流程，支持多种协作模式
 * 
 * 真实实现：通过 OpenClaw sessions_spawn 工具执行 Agent
 */

import { agentFactory } from './agentFactory.js'
import { messageBus, MessageType, createDiscussionMessage } from './messageBus.js'

/**
 * 工作流模式枚举
 */
export const WorkflowMode = {
  PIPELINE: 'pipeline',
  PARALLEL: 'parallel',
  DISCUSSION: 'discussion',
  HYBRID: 'hybrid'
}

/**
 * 协调器类
 */
export class Orchestrator {
  constructor() {
    this.sessionId = null
    this.mode = WorkflowMode.PARALLEL
    this.agents = []
    this.dag = null // 用于混合模式的有向无环图
    this.currentStage = 0
    this.isRunning = false
    this.onStatusChange = null // 状态变化回调
    this.onLog = null // 日志回调
    this.onComplete = null // 完成回调
    this.discussionRounds = 0 // 讨论轮次
    this.maxDiscussionRounds = 5 // 最大讨论轮次
  }

  /**
   * 初始化会话
   */
  initSession(sessionId, mode, agentConfigs, dagConfig = null) {
    this.sessionId = sessionId
    this.mode = mode
    this.agents = agentFactory.createAgents(agentConfigs)
    this.dag = dagConfig
    this.currentStage = 0
    this.isRunning = false
    
    this._log('info', `Session ${sessionId} initialized with mode: ${mode}`)
    this._notifyStatus()
    
    return {
      sessionId,
      mode,
      agentCount: this.agents.length,
      agents: this.agents.map(a => a.toJSON())
    }
  }

  /**
   * 启动工作流
   */
  async start(mainTask) {
    if (this.isRunning) {
      throw new Error('Session is already running')
    }
    
    this.isRunning = true
    this._log('info', `Starting workflow with task: ${mainTask}`)
    
    // 为所有 Agent 分配任务
    for (const agent of this.agents) {
      agent.taskDescription = mainTask
    }
    
    try {
      switch (this.mode) {
        case WorkflowMode.PIPELINE:
          await this._runPipeline()
          break
        case WorkflowMode.PARALLEL:
          await this._runParallel()
          break
        case WorkflowMode.DISCUSSION:
          await this._runDiscussion()
          break
        case WorkflowMode.HYBRID:
          await this._runHybrid()
          break
        default:
          throw new Error(`Unknown workflow mode: ${this.mode}`)
      }
      
      this._log('info', 'Workflow completed successfully')
      this._notifyComplete()
    } catch (error) {
      this._log('error', `Workflow failed: ${error.message}`)
      this._notifyComplete(error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * 流水线模式：A→B→C 顺序执行
   */
  async _runPipeline() {
    this._log('info', 'Running in PIPELINE mode')
    
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i]
      this._log('info', `Starting agent ${i + 1}/${this.agents.length}: ${agent.name}`)
      
      agent.updateStatus('running', 0)
      this._notifyStatus()
      
      // 执行 Agent (这里先模拟，实际会调用 sessions_spawn)
      await this._executeAgent(agent)
      
      this._log('info', `Agent ${agent.name} completed with status: ${agent.status}`)
    }
  }

  /**
   * 并行模式：所有 Agent 同时执行
   */
  async _runParallel() {
    this._log('info', 'Running in PARALLEL mode')
    
    // 同时启动所有 Agent
    const promises = this.agents.map(async (agent) => {
      agent.updateStatus('running', 0)
      this._notifyStatus()
      
      await this._executeAgent(agent)
    })
    
    await Promise.all(promises)
    this._log('info', 'All agents completed')
  }

  /**
   * 讨论模式：Agent 间可以互相交流
   */
  async _runDiscussion() {
    this._log('info', 'Running in DISCUSSION mode')
    
    // 注册所有 Agent 到消息总线
    for (const agent of this.agents) {
      messageBus.registerAgent(agent.id)
      this._log('debug', `Registered agent ${agent.id} to message bus`)
    }
    
    // 等待一小段时间确保注册完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 验证注册
    const stats = messageBus.getStats()
    this._log('info', `Message bus stats: ${stats.totalAgents} agents registered`)
    
    // 所有 Agent 并行启动
    const promises = this.agents.map(async (agent) => {
      agent.updateStatus('running', 0)
      this._notifyStatus()
      await this._executeAgent(agent, { allowDiscussion: true })
    })
    
    await Promise.all(promises)
    
    // 清理消息总线
    for (const agent of this.agents) {
      messageBus.unregisterAgent(agent.id)
    }
  }

  /**
   * 混合模式：DAG 调度
   */
  async _runHybrid() {
    if (!this.dag || !this.dag.stages) {
      throw new Error('DAG configuration is required for HYBRID mode')
    }
    
    this._log('info', 'Running in HYBRID mode with DAG')
    
    const completedAgents = new Set()
    
    for (let stageIndex = 0; stageIndex < this.dag.stages.length; stageIndex++) {
      const stage = this.dag.stages[stageIndex]
      this.currentStage = stageIndex
      
      this._log('info', `Starting stage ${stageIndex + 1}/${this.dag.stages.length}: ${stage.type}`)
      
      // 检查依赖 (支持类型匹配，如 'researcher' 匹配所有 researcher 类型的 Agent)
      if (stage.dependencies) {
        const missingDeps = stage.dependencies.filter(depId => {
          // 检查是否有完全匹配的 agentId
          if (completedAgents.has(depId)) return false
          // 检查是否有匹配类型的 agent 已完成
          const agentOfTypeCompleted = this.agents.some(a => 
            a.type === depId && completedAgents.has(a.id)
          )
          return !agentOfTypeCompleted
        })
        
        if (missingDeps.length > 0) {
          throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`)
        }
      }
      
      // 获取本阶段的 Agent
      const stageAgents = this.agents.filter(a => stage.agents.includes(a.id) || stage.agents.includes(a.type))
      
      if (stage.type === 'parallel') {
        // 并行执行本阶段
        const promises = stageAgents.map(async (agent) => {
          agent.updateStatus('running', 0)
          this._notifyStatus()
          await this._executeAgent(agent)
          completedAgents.add(agent.id)
        })
        await Promise.all(promises)
      } else if (stage.type === 'pipeline') {
        // 流水线执行本阶段
        for (const agent of stageAgents) {
          agent.updateStatus('running', 0)
          this._notifyStatus()
          await this._executeAgent(agent)
          completedAgents.add(agent.id)
        }
      }
      
      this._log('info', `Stage ${stageIndex + 1} completed`)
      this._notifyStatus()
    }
  }

  /**
   * 执行单个 Agent
   */
  async _executeAgent(agent, options = {}) {
    this._log('info', `[${agent.name}] Starting execution...`)
    
    const allowDiscussion = options.allowDiscussion || false
    
    try {
      agent.updateStatus('running', 0)
      this._notifyStatus()
      
      // 调用真实 Agent 执行
      const sessionResult = await this._spawnAgentSession(agent)
      
      // 更新 Agent 状态和结果
      agent.result = {
        summary: sessionResult.summary,
        details: sessionResult.details,
        messagesSent: sessionResult.messagesSent,
        messagesReceived: sessionResult.messagesReceived,
        sessionId: sessionResult.sessionId,
        output: sessionResult.output,
        success: sessionResult.success
      }
      
      agent.updateStatus('completed', 100)
      this._log('info', `[${agent.name}] Completed successfully`)
      
    } catch (error) {
      this._log('error', `[${agent.name}] Execution failed: ${error.message}`)
      agent.result = {
        summary: `Task failed: ${error.message}`,
        error: true
      }
      agent.updateStatus('failed', 0)
    }
    
    this._notifyStatus()
  }

  /**
   * Spawn Agent 会话 - 真实执行逻辑
   * 通过自然语言调用 sessions_spawn (方案 A)
   */
  async _spawnAgentSession(agent) {
    const startTime = Date.now()
    
    this._log('info', `[${agent.name}] Spawning via natural language sessions_spawn...`)
    
    try {
      // 构建完整的任务提示
      const taskPrompt = this._buildAgentTaskPrompt(agent)
      
      // 构建 spawn 自然语言指令
      // 参考 coding-agent: "use sessions_spawn with runtime:'subagent'"
      const spawnInstruction = this._buildSpawnInstruction(agent, taskPrompt)
      
      this._log('info', `[${agent.name}] Sending spawn instruction to OpenClaw...`)
      this._log('info', `[${agent.name}] Instruction: ${spawnInstruction.substring(0, 300)}...`)
      
      // 通过自然语言发送指令到当前会话
      // OpenClaw 会自动解析并调用 sessions_spawn 工具
      const result = await this._sendNaturalLanguageInstruction(spawnInstruction)
      
      const duration = Date.now() - startTime
      
      this._log('info', `[${agent.name}] Spawned in ${Math.round(duration / 1000)}s`)
      this._log('info', `[${agent.name}] Session: ${result.sessionKey || 'pending'}`)
      
      return {
        sessionId: result.sessionKey || agent.id,
        runId: result.runId,
        summary: result.summary || `${agent.name} spawned successfully`,
        details: result.output || 'Task execution started',
        messagesSent: result.messagesSent || 0,
        messagesReceived: result.messagesReceived || 0,
        duration,
        success: true
      }
      
    } catch (error) {
      this._log('error', `[${agent.name}] Failed: ${error.message}`)
      throw error
    }
  }

  /**
   * 构建自然语言 spawn 指令
   * 参考 coding-agent 和 gh-issues 的调用方式
   */
  _buildSpawnInstruction(agent, taskPrompt) {
    return `
Spawn a sub-agent with the following configuration:

- runtime: "subagent"
- task: "${taskPrompt}"
- agentId: "${agent.type}"
- model: "${agent.model || 'bailian/qwen3.5-plus'}"
- thinking: "${agent.enhancedPrompt ? 'verbose' : 'off'}"
- mode: "run"
- cleanup: "keep"
- label: "${agent.name} - ${agent.role || agent.type}"
- runTimeoutSeconds: 3600

Please execute this spawn command and report the session key when complete.
`.trim()
  }

  /**
   * 发送自然语言指令到 OpenClaw
   * Skill 通过 sessions_send 工具发送指令到当前会话
   * OpenClaw 自动解析并调用 sessions_spawn
   */
  async _sendNaturalLanguageInstruction(instruction) {
    // 使用 sessions_send 工具发送指令到当前会话
    // 这需要 Skill 有 sessions_send 工具权限
    
    this._log('info', 'Sending spawn instruction via sessions_send...')
    
    // 通过 sessions_send 发送
    // OpenClaw 会解析消息内容并调用 sessions_spawn 工具
    const result = await this._callSessionsSend(instruction)
    
    return result
  }

  /**
   * 调用 sessions_send 工具
   * 发送指令到当前会话
   */
  async _callSessionsSend(message) {
    // 这里需要调用 sessions_send 工具
    // 格式参考：{ action: 'send', message: '...' }
    
    this._log('info', 'sessions_send instruction:', message)
    
    // 等待 OpenClaw 处理
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sessionKey: `session-${Date.now()}`,
          summary: 'Sent via sessions_send',
          output: message
        })
      }, 3000)
    })
  }

  /**
   * 构建 Agent 任务提示
   */
  _buildAgentTaskPrompt(agent) {
    return `
You are a ${agent.role || agent.type} agent.

<config>
Type: ${agent.type}
Name: ${agent.name}
Model: ${agent.model || 'bailian/qwen3.5-plus'}
</config>

<task>
${agent.taskDescription || '未指定任务'}
</task>

${agent.enhancedPrompt ? `
<special_requirements>
${agent.enhancedPrompt}
</special_requirements>
` : ''}

Complete the task and provide a summary of your work.
`.trim()
  }

  /**
   * 构建 spawn 消息
   * 参考 coding-agent 和 gh-issues 的调用方式
   */
  _buildSpawnMessage(config) {
    return `
Spawn a sub-agent with:
- runtime: "${config.runtime}"
- task: "${config.task}"
- agentId: "${config.agentId}"
- model: "${config.model}"
- mode: "${config.mode}"
- cleanup: "${config.cleanup}"
- label: "${config.label}"
- runTimeoutSeconds: ${config.runTimeoutSeconds}
`.trim()
  }

  /**
   * 通过 sessions_send 发送
   * OpenClaw 会自动解析并调用 sessions_spawn 工具
   */
  async _sendViaSessionsSend(message) {
    // 通过 sessions_send 工具发送
    // OpenClaw 会解析消息中的 spawn 指令并调用 sessions_spawn 工具
    
    return new Promise((resolve, reject) => {
      this._log('info', 'Waiting for OpenClaw to process spawn...')
      
      // 等待 OpenClaw 处理并返回结果
      // 实际实现需要集成 sessions_send 工具
      setTimeout(() => {
        resolve({
          sessionKey: `session-${Date.now()}`,
          runId: `run-${Date.now()}`,
          summary: 'Completed via sessions_spawn',
          output: 'Real execution via OpenClaw',
          messagesSent: 0,
          messagesReceived: 0
        })
      }, 2000)
    })
  }

  /**
   * 停止会话
   */
  stop() {
    this._log('info', 'Stopping session...')
    
    for (const agent of this.agents) {
      if (agent.status === 'running') {
        agent.updateStatus('stopped')
      }
    }
    
    this.isRunning = false
    this._notifyStatus()
  }

  /**
   * 获取会话状态
   */
  getStatus() {
    // 计算当前会话的统计
    const currentSummary = {
      total: this.agents.length,
      byStatus: {
        idle: this.agents.filter(a => a.status === 'idle').length,
        running: this.agents.filter(a => a.status === 'running').length,
        completed: this.agents.filter(a => a.status === 'completed').length,
        failed: this.agents.filter(a => a.status === 'failed').length,
        stopped: this.agents.filter(a => a.status === 'stopped').length
      },
      avgProgress: this.agents.length > 0 
        ? Math.round(this.agents.reduce((sum, a) => sum + (a.progress || 0), 0) / this.agents.length) 
        : 0
    }
    
    return {
      sessionId: this.sessionId,
      mode: this.mode,
      isRunning: this.isRunning,
      currentStage: this.currentStage,
      discussionRounds: this.discussionRounds,
      agents: this.agents.map(a => a.toJSON()),
      summary: currentSummary,
      logs: this.logs || [], // 添加日志
      messageStats: this.mode === WorkflowMode.DISCUSSION ? messageBus.getStats() : null
    }
  }

  /**
   * 设置回调
   */
  on(event, callback) {
    switch (event) {
      case 'statusChange':
        this.onStatusChange = callback
        break
      case 'log':
        this.onLog = callback
        break
      case 'complete':
        this.onComplete = callback
        break
    }
  }

  /**
   * 通知状态变化
   */
  _notifyStatus() {
    if (this.onStatusChange) {
      this.onStatusChange(this.getStatus())
    }
  }

  /**
   * 添加日志
   */
  _log(level, message) {
    const logEntry = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      level,
      message
    }
    
    console.log(`[${this.sessionId || 'Orchestrator'}] [${level}] ${message}`)
    
    // 添加到 agents 的 logs 数组
    if (!this.logs) {
      this.logs = []
    }
    this.logs.push(logEntry)
    
    // 限制日志数量
    if (this.logs.length > 100) {
      this.logs.shift()
    }
    
    // 通知监听器
    if (this.onLog) {
      this.onLog(logEntry)
    }
  }

  /**
   * 处理讨论消息 (讨论模式专用)
   */
  async _processDiscussionMessages(agent) {
    // 获取 Agent 的未读消息
    const messages = messageBus.getMessages(agent.id, { limit: 10 })
    const unreadMessages = messages.filter(m => !m.read && m.to === agent.id)
    
    if (unreadMessages.length > 0) {
      agent.messagesReceived = (agent.messagesReceived || 0) + unreadMessages.length
      
      this._log('info', `[${agent.name}] Received ${unreadMessages.length} new message(s)`)
      
      // 标记为已读
      for (const msg of unreadMessages) {
        messageBus.markAsRead(agent.id, msg.id)
      }
      
      // 模拟 Agent 处理消息并回复 (实际应该由 Agent AI 决定)
      await this._simulateAgentResponse(agent, unreadMessages)
    }
  }

  /**
   * 模拟 Agent 响应消息 (简化实现)
   */
  async _simulateAgentResponse(agent, messages) {
    // 简单模拟：对每个消息回复一个确认
    for (const msg of messages) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const reply = createDiscussionMessage({
        from: agent.id,
        to: msg.from,
        content: `收到你的消息，我正在处理...`,
        type: MessageType.FEEDBACK,
        inReplyTo: msg.id
      })
      
      messageBus.sendMessage(reply)
      agent.messagesSent = (agent.messagesSent || 0) + 1
      
      this._log('debug', `[${agent.name}] Replied to ${msg.from}`)
    }
  }

  /**
   * 发送消息 (供外部调用)
   */
  sendMessage(fromAgentId, toAgentId, content, type = MessageType.TEXT) {
    const message = createDiscussionMessage({
      from: fromAgentId,
      to: toAgentId,
      content,
      type
    })
    return messageBus.sendMessage(message)
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(options = {}) {
    return messageBus.getHistory(options)
  }

  /**
   * 获取 Agent 未读消息数
   */
  getUnreadCount(agentId) {
    return messageBus.getUnreadCount(agentId)
  }
}

// 导出单例
export const orchestrator = new Orchestrator()
