/**
 * Multi-Agent Coordinator Skill - 入口文件
 * 
 * 用法:
 * 1. 通过 Web UI: 启动服务器后访问 http://localhost:3456
 * 2. 通过自然语言：调用 skill 并传入配置
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { orchestrator, WorkflowMode } from './orchestrator.js'
import { agentFactory } from './agentFactory.js'
import { communicationBus, MessageType, createMessage } from './communication.js'
import { aggregator } from './aggregator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

/**
 * Skill 主类
 */
export class MultiAgentCoordinator {
  constructor() {
    this.currentSession = null
    this.isInitialized = false
  }

  /**
   * 初始化 Skill
   */
  async init() {
    if (this.isInitialized) {
      return { success: true, message: 'Already initialized' }
    }

    try {
      // 启动 WebSocket 服务器
      await communicationBus.start()
      
      // 设置事件监听
      this._setupEventListeners()
      
      this.isInitialized = true
      console.log('[MultiAgentCoordinator] Initialized successfully')
      
      return {
        success: true,
        message: 'Multi-Agent Coordinator initialized',
        config: {
          httpPort: config.server.httpPort,
          wsPort: config.server.wsPort,
          agentTypes: Object.keys(config.agentTypes),
          workflowModes: Object.keys(config.workflowModes)
        }
      }
    } catch (error) {
      console.error('[MultiAgentCoordinator] Initialization failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 设置事件监听
   */
  _setupEventListeners() {
    orchestrator.on('statusChange', (status) => {
      communicationBus.broadcast(
        createMessage(MessageType.STATUS_UPDATE, status)
      )
    })

    orchestrator.on('log', (log) => {
      communicationBus.broadcast(
        createMessage(MessageType.LOG, log)
      )
    })

    orchestrator.on('complete', (result) => {
      communicationBus.broadcast(
        createMessage(MessageType.SESSION_COMPLETE, result)
      )
      
      // 生成报告
      if (this.currentSession) {
        const report = aggregator.generateReport(
          orchestrator.mode,
          orchestrator.agents
        )
        this.lastReport = report
      }
    })
  }

  /**
   * 创建并启动多 Agent 会话
   */
  async startSession(sessionConfig) {
    const {
      sessionId = `session-${Date.now()}`,
      mode = 'parallel',
      agents = [],
      task = '',
      dag = null
    } = sessionConfig

    console.log('[MultiAgentCoordinator] Starting session:', sessionId)

    // 初始化协调器
    const agentConfigs = agents.map(agent => ({
      type: agent.type,
      role: agent.role || `${agent.type} Agent`,
      enhancedPrompt: agent.enhancedPrompt || '',
      model: agent.model || undefined
    }))

    const initResult = orchestrator.initSession(
      sessionId,
      mode,
      agentConfigs,
      dag
    )

    // 初始化聚合器
    aggregator.initSession(sessionId)

    this.currentSession = sessionId

    // 启动工作流 (不等待完成)
    orchestrator.start(task).then((result) => {
      console.log('[MultiAgentCoordinator] Session completed:', result)
    }).catch((error) => {
      console.error('[MultiAgentCoordinator] Session failed:', error)
    })

    return {
      success: true,
      sessionId,
      ...initResult
    }
  }

  /**
   * 获取会话状态
   */
  getSessionStatus(sessionId) {
    // 如果没有 sessionId 且有当前会话，返回当前会话状态
    if (!sessionId && this.currentSession) {
      sessionId = this.currentSession
    }
    
    // 检查会话是否存在
    if (sessionId && sessionId !== this.currentSession) {
      return { 
        error: 'Session not found',
        sessionId,
        currentSession: this.currentSession,
        agents: [],
        isRunning: false
      }
    }

    if (!this.currentSession) {
      return { 
        error: 'No active session',
        agents: [],
        isRunning: false,
        summary: { total: 0, avgProgress: 0 }
      }
    }

    const status = orchestrator.getStatus()
    
    // 确保总是返回有效对象
    return status || {
      sessionId: this.currentSession,
      agents: [],
      isRunning: false,
      summary: { total: 0, avgProgress: 0 }
    }
  }

  /**
   * 停止会话
   */
  stopSession(sessionId) {
    if (sessionId && sessionId !== this.currentSession) {
      return { error: 'Session not found' }
    }

    orchestrator.stop()
    return { success: true, message: 'Session stopped' }
  }

  /**
   * 获取可用 Agent 类型
   */
  getAgentTypes() {
    return Object.entries(config.agentTypes).map(([key, value]) => ({
      key,
      name: value.name,
      icon: value.icon,
      description: value.basePrompt.split('\n')[0]
    }))
  }

  /**
   * 获取工作流模式
   */
  getWorkflowModes() {
    return Object.entries(config.workflowModes).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description,
      icon: value.icon
    }))
  }

  /**
   * 获取最新报告
   */
  getLastReport() {
    return this.lastReport || null
  }

  /**
   * 导出报告为 Markdown
   */
  exportReport() {
    if (!this.lastReport) {
      return { error: 'No report available' }
    }

    const markdown = aggregator.exportToMarkdown(this.lastReport)
    return { success: true, markdown }
  }
}

// 导出单例
export const coordinator = new MultiAgentCoordinator()

// 默认导出
export default coordinator
