/**
 * Agent Factory - Agent 工厂模块
 * 负责根据配置创建和管理子 Agent
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

/**
 * Agent 类型定义
 */
export class AgentConfig {
  constructor(type, customConfig = {}) {
    const baseConfig = config.agentTypes[type] || config.agentTypes.others
    
    this.id = `agent-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.type = type
    this.name = customConfig.name || baseConfig.name
    this.icon = baseConfig.icon
    this.role = customConfig.role || `${baseConfig.name} Agent`
    this.basePrompt = baseConfig.basePrompt
    this.enhancedPrompt = customConfig.enhancedPrompt || ''
    this.allowedTools = customConfig.allowedTools || baseConfig.allowedTools
    this.model = customConfig.model || baseConfig.defaultModel
    this.status = 'idle' // idle | running | completed | failed | stopped
    this.progress = 0
    this.logs = []
    this.result = null
    this.error = null
    this.startedAt = null
    this.completedAt = null
  }

  /**
   * 生成完整的系统提示
   */
  getSystemPrompt() {
    const parts = [this.basePrompt]
    
    if (this.enhancedPrompt) {
      parts.push('\n\n## 特别要求\n' + this.enhancedPrompt)
    }
    
    parts.push(`\n\n## 当前任务\n${this.taskDescription || '等待分配任务...'}`)
    
    parts.push('\n\n## 输出要求\n- 保持简洁专业\n- 使用结构化格式\n- 重要结论放在前面')
    
    return parts.join('')
  }

  /**
   * 添加日志
   */
  addLog(level, message) {
    this.logs.push({
      timestamp: Date.now(),
      level, // info | warn | error | debug
      message
    })
    
    // 限制日志缓冲区大小
    if (this.logs.length > config.defaults.logBufferSize) {
      this.logs.shift()
    }
  }

  /**
   * 更新状态
   */
  updateStatus(status, progress = null) {
    this.status = status
    if (progress !== null) this.progress = progress
    
    if (status === 'running' && !this.startedAt) {
      this.startedAt = Date.now()
    }
    
    if (['completed', 'failed', 'stopped'].includes(status) && !this.completedAt) {
      this.completedAt = Date.now()
    }
    
    this.addLog('info', `Status changed to: ${status}${progress !== null ? ` (${progress}%)` : ''}`)
  }

  /**
   * 获取运行时长 (毫秒)
   */
  getDuration() {
    const start = this.startedAt || Date.now()
    const end = this.completedAt || Date.now()
    return end - start
  }

  /**
   * 序列化为 JSON (用于传输)
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      icon: this.icon,
      role: this.role,
      status: this.status,
      progress: this.progress,
      logs: this.logs.slice(-10), // 只返回最近 10 条日志
      result: this.result,
      error: this.error,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.getDuration()
    }
  }
}

/**
 * Agent 工厂类
 */
export class AgentFactory {
  constructor() {
    this.agents = new Map()
  }

  /**
   * 创建单个 Agent
   */
  createAgent(type, customConfig = {}) {
    const agent = new AgentConfig(type, customConfig)
    this.agents.set(agent.id, agent)
    console.log(`[AgentFactory] Created agent: ${agent.id} (type: ${type})`)
    return agent
  }

  /**
   * 批量创建 Agents
   */
  createAgents(agentConfigs) {
    const agents = []
    for (const cfg of agentConfigs) {
      const agent = this.createAgent(cfg.type, cfg)
      agents.push(agent)
    }
    return agents
  }

  /**
   * 获取 Agent
   */
  getAgent(agentId) {
    return this.agents.get(agentId)
  }

  /**
   * 获取所有 Agent
   */
  getAllAgents() {
    return Array.from(this.agents.values())
  }

  /**
   * 删除 Agent
   */
  removeAgent(agentId) {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.updateStatus('stopped')
      this.agents.delete(agentId)
      console.log(`[AgentFactory] Removed agent: ${agentId}`)
      return true
    }
    return false
  }

  /**
   * 清空所有 Agent
   */
  clear() {
    for (const agent of this.agents.values()) {
      agent.updateStatus('stopped')
    }
    this.agents.clear()
    console.log('[AgentFactory] Cleared all agents')
  }

  /**
   * 获取状态摘要
   */
  getStatusSummary() {
    const agents = this.getAllAgents()
    return {
      total: agents.length,
      byStatus: {
        idle: agents.filter(a => a.status === 'idle').length,
        running: agents.filter(a => a.status === 'running').length,
        completed: agents.filter(a => a.status === 'completed').length,
        failed: agents.filter(a => a.status === 'failed').length,
        stopped: agents.filter(a => a.status === 'stopped').length
      },
      avgProgress: agents.length > 0 
        ? Math.round(agents.reduce((sum, a) => sum + a.progress, 0) / agents.length) 
        : 0
    }
  }
}

// 导出单例
export const agentFactory = new AgentFactory()
