/**
 * Agent Controller - Agent 手动干预控制器
 * 支持暂停/继续/终止单个 Agent，动态调整职责
 */

import { EventEmitter } from 'events'

/**
 * Agent 状态枚举
 */
export const AgentStatus = {
  IDLE: 'idle',           // 空闲
  RUNNING: 'running',     // 运行中
  PAUSED: 'paused',       // 已暂停
  STOPPED: 'stopped',     // 已停止
  COMPLETED: 'completed'  // 已完成
}

/**
 * 干预操作类型
 */
export const InterventionType = {
  PAUSE: 'pause',         // 暂停
  RESUME: 'resume',       // 继续
  STOP: 'stop',           // 终止
  MODIFY_ROLE: 'modify_role',     // 修改职责
  MODIFY_PRIORITY: 'modify_priority', // 修改优先级
  ADD_TASK: 'add_task'    // 添加任务
}

/**
 * 干预记录类
 */
export class InterventionRecord {
  constructor({
    id = `intervention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    agentId,
    type,
    reason,
    operator = 'user',
    timestamp = Date.now(),
    previousState = null,
    newState = null,
    metadata = {}
  }) {
    this.id = id
    this.sessionId = sessionId
    this.agentId = agentId
    this.type = type
    this.reason = reason
    this.operator = operator
    this.timestamp = timestamp
    this.previousState = previousState
    this.newState = newState
    this.metadata = metadata
  }

  toJSON() {
    return { ...this }
  }
}

/**
 * Agent 控制器类
 */
export class AgentController extends EventEmitter {
  constructor() {
    super()
    this.agentStates = new Map()  // Agent 状态映射
    this.interventions = []       // 干预历史记录
    this.maxHistory = 100         // 最大历史记录数
  }

  /**
   * 注册 Agent
   */
  registerAgent(agentId, initialState = AgentStatus.IDLE) {
    if (!this.agentStates.has(agentId)) {
      this.agentStates.set(agentId, {
        id: agentId,
        status: initialState,
        role: null,
        priority: 'normal',
        tasks: [],
        pausedAt: null,
        resumedAt: null,
        stoppedAt: null,
        interventionCount: 0
      })
      console.log(`[AgentController] Agent registered: ${agentId}`)
      this.emit('agent:registered', { agentId, status: initialState })
    }
  }

  /**
   * 注销 Agent
   */
  unregisterAgent(agentId) {
    const state = this.agentStates.get(agentId)
    if (state) {
      this.agentStates.delete(agentId)
      console.log(`[AgentController] Agent unregistered: ${agentId}`)
      this.emit('agent:unregistered', { agentId })
    }
  }

  /**
   * 获取 Agent 状态
   */
  getAgentState(agentId) {
    return this.agentStates.get(agentId) || null
  }

  /**
   * 获取所有 Agent 状态
   */
  getAllStates() {
    return Array.from(this.agentStates.values())
  }

  /**
   * 暂停 Agent
   */
  pauseAgent(agentId, reason = '手动暂停') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    if (state.status !== AgentStatus.RUNNING) {
      throw new Error(`Agent is not running: ${state.status}`)
    }

    const previousState = { ...state }
    state.status = AgentStatus.PAUSED
    state.pausedAt = Date.now()
    state.interventionCount++

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.PAUSE,
      reason,
      previousState: { status: AgentStatus.RUNNING },
      newState: { status: AgentStatus.PAUSED }
    })

    console.log(`[AgentController] Agent ${agentId} paused: ${reason}`)
    this.emit('agent:paused', { agentId, reason, timestamp: state.pausedAt })

    return true
  }

  /**
   * 继续 Agent
   */
  resumeAgent(agentId, reason = '手动继续') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    if (state.status !== AgentStatus.PAUSED) {
      throw new Error(`Agent is not paused: ${state.status}`)
    }

    const previousState = { ...state }
    state.status = AgentStatus.RUNNING
    state.resumedAt = Date.now()
    state.interventionCount++

    // 计算暂停时长
    const pauseDuration = state.resumedAt - state.pausedAt

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.RESUME,
      reason,
      previousState: { status: AgentStatus.PAUSED },
      newState: { status: AgentStatus.RUNNING },
      metadata: { pauseDuration }
    })

    console.log(`[AgentController] Agent ${agentId} resumed: ${reason} (paused for ${pauseDuration}ms)`)
    this.emit('agent:resumed', { agentId, reason, timestamp: state.resumedAt, pauseDuration })

    return true
  }

  /**
   * 终止 Agent
   */
  stopAgent(agentId, reason = '手动终止') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    if (state.status === AgentStatus.STOPPED) {
      throw new Error(`Agent already stopped: ${agentId}`)
    }

    const previousState = { ...state }
    state.status = AgentStatus.STOPPED
    state.stoppedAt = Date.now()
    state.interventionCount++

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.STOP,
      reason,
      previousState: { status: state.status },
      newState: { status: AgentStatus.STOPPED }
    })

    console.log(`[AgentController] Agent ${agentId} stopped: ${reason}`)
    this.emit('agent:stopped', { agentId, reason, timestamp: state.stoppedAt })

    return true
  }

  /**
   * 修改 Agent 职责
   */
  modifyRole(agentId, newRole, reason = '职责调整') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    const previousRole = state.role
    state.role = newRole
    state.interventionCount++

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.MODIFY_ROLE,
      reason,
      previousState: { role: previousRole },
      newState: { role: newRole }
    })

    console.log(`[AgentController] Agent ${agentId} role changed: ${previousRole} → ${newRole}`)
    this.emit('agent:roleChanged', { agentId, previousRole, newRole, reason })

    return true
  }

  /**
   * 修改 Agent 优先级
   */
  modifyPriority(agentId, newPriority, reason = '优先级调整') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent']
    if (!validPriorities.includes(newPriority)) {
      throw new Error(`Invalid priority: ${newPriority}`)
    }

    const previousPriority = state.priority
    state.priority = newPriority
    state.interventionCount++

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.MODIFY_PRIORITY,
      reason,
      previousState: { priority: previousPriority },
      newState: { priority: newPriority }
    })

    console.log(`[AgentController] Agent ${agentId} priority changed: ${previousPriority} → ${newPriority}`)
    this.emit('agent:priorityChanged', { agentId, previousPriority, newPriority, reason })

    return true
  }

  /**
   * 添加任务给 Agent
   */
  addTask(agentId, task, reason = '添加任务') {
    const state = this.agentStates.get(agentId)
    if (!state) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    state.tasks.push({
      id: `task-${Date.now()}`,
      content: task,
      addedAt: Date.now(),
      completed: false
    })
    state.interventionCount++

    // 记录干预
    this._recordIntervention({
      sessionId: state.sessionId,
      agentId,
      type: InterventionType.ADD_TASK,
      reason,
      metadata: { task }
    })

    console.log(`[AgentController] Task added to agent ${agentId}: ${task}`)
    this.emit('agent:taskAdded', { agentId, task })

    return true
  }

  /**
   * 获取干预历史
   */
  getInterventionHistory(options = {}) {
    let history = [...this.interventions]

    if (options.agentId) {
      history = history.filter(i => i.agentId === options.agentId)
    }
    if (options.type) {
      history = history.filter(i => i.type === options.type)
    }
    if (options.since) {
      history = history.filter(i => i.timestamp > options.since)
    }
    if (options.limit) {
      history = history.slice(-options.limit)
    }

    return history
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const states = this.getAllStates()
    
    return {
      totalAgents: states.length,
      byStatus: {
        idle: states.filter(s => s.status === AgentStatus.IDLE).length,
        running: states.filter(s => s.status === AgentStatus.RUNNING).length,
        paused: states.filter(s => s.status === AgentStatus.PAUSED).length,
        stopped: states.filter(s => s.status === AgentStatus.STOPPED).length,
        completed: states.filter(s => s.status === AgentStatus.COMPLETED).length
      },
      totalInterventions: this.interventions.length,
      interventionsByType: this.interventions.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1
        return acc
      }, {}),
      avgInterventionsPerAgent: this.interventions.length / (states.length || 1)
    }
  }

  /**
   * 记录干预
   */
  _recordIntervention(data) {
    const record = new InterventionRecord(data)
    this.interventions.push(record)
    this._trimHistory()
    this.emit('intervention:recorded', record)
  }

  /**
   * 修剪历史记录
   */
  _trimHistory() {
    if (this.interventions.length > this.maxHistory) {
      this.interventions = this.interventions.slice(-this.maxHistory)
    }
  }

  /**
   * 清空所有状态
   */
  clear() {
    this.agentStates.clear()
    this.interventions = []
    console.log('[AgentController] All states cleared')
    this.emit('controller:cleared')
  }

  /**
   * 导出状态
   */
  exportState() {
    return {
      agents: this.getAllStates(),
      interventions: this.interventions.map(i => i.toJSON()),
      exportedAt: Date.now()
    }
  }

  /**
   * 导入状态
   */
  importState(data) {
    if (data.agents) {
      for (const agent of data.agents) {
        this.agentStates.set(agent.id, agent)
      }
    }
    if (data.interventions) {
      this.interventions = data.interventions.map(i => new InterventionRecord(i))
    }
    console.log('[AgentController] State imported')
  }
}

// 导出单例
export const agentController = new AgentController()

// 导出便捷函数
export function createIntervention({ sessionId, agentId, type, reason }) {
  return new InterventionRecord({ sessionId, agentId, type, reason })
}
