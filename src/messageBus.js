/**
 * Message Bus - Agent 间消息通信总线
 * 支持讨论模式下 Agent 互相发送/接收消息
 */

import { EventEmitter } from 'events'

/**
 * 消息类型枚举
 */
export const MessageType = {
  TEXT: 'text',              // 普通文本消息
  QUESTION: 'question',      // 提问
  ANSWER: 'answer',          // 回答
  REQUEST: 'request',        // 请求帮助
  SUGGESTION: 'suggestion',  // 建议
  FEEDBACK: 'feedback',      // 反馈
  SYSTEM: 'system'           // 系统消息
}

/**
 * 消息优先级
 */
export const MessagePriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * 消息类
 */
export class Message {
  constructor({
    id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from,
    to,
    type = MessageType.TEXT,
    content,
    priority = MessagePriority.NORMAL,
    inReplyTo = null,
    mentions = [],
    attachments = [],
    metadata = {}
  }) {
    this.id = id
    this.from = from          // 发送者 Agent ID
    this.to = to              // 接收者 Agent ID (可为 null 表示广播)
    this.type = type
    this.content = content    // 消息内容
    this.priority = priority
    this.inReplyTo = inReplyTo // 回复的消息 ID
    this.mentions = mentions  // @提及的 Agent IDs
    this.attachments = attachments // 附件 (如代码片段、文件引用)
    this.metadata = metadata  // 元数据
    this.timestamp = Date.now()
    this.delivered = false
    this.read = false
  }

  toJSON() {
    return {
      ...this,
      timestamp: this.timestamp,
      delivered: this.delivered,
      read: this.read
    }
  }
}

/**
 * 消息总线类
 */
export class MessageBus extends EventEmitter {
  constructor() {
    super()
    this.messages = []           // 所有消息
    this.queues = new Map()      // 每个 Agent 的消息队列
    this.subscriptions = new Map() // 订阅关系
    this.maxHistory = 1000       // 最大消息历史数
  }

  /**
   * 注册 Agent
   */
  registerAgent(agentId) {
    if (!this.queues.has(agentId)) {
      this.queues.set(agentId, [])
      console.log(`[MessageBus] Agent registered: ${agentId}`)
    }
  }

  /**
   * 注销 Agent
   */
  unregisterAgent(agentId) {
    this.queues.delete(agentId)
    this.subscriptions.delete(agentId)
    console.log(`[MessageBus] Agent unregistered: ${agentId}`)
  }

  /**
   * 发送消息
   */
  sendMessage(message) {
    if (!(message instanceof Message)) {
      message = new Message(message)
    }

    console.log(`[MessageBus] Message from ${message.from} to ${message.to || 'all'}: ${message.content.substring(0, 50)}...`)

    // 添加到历史
    this.messages.push(message)
    this._trimHistory()

    // 投递到接收者队列
    if (message.to) {
      // 点对点消息
      this._deliverToAgent(message.to, message)
    } else {
      // 广播消息 (排除发送者)
      for (const [agentId] of this.queues) {
        if (agentId !== message.from) {
          this._deliverToAgent(agentId, message)
        }
      }
    }

    // 通知订阅者
    this.emit('message', message)
    this.emit(`message:${message.to || 'broadcast'}`, message)

    return message
  }

  /**
   * 投递消息到 Agent 队列
   */
  _deliverToAgent(agentId, message) {
    const queue = this.queues.get(agentId)
    if (queue) {
      queue.push(message)
      message.delivered = true
      this.emit(`message:${agentId}`, message)
      console.log(`[MessageBus] Delivered message to ${agentId}`)
    }
  }

  /**
   * 获取 Agent 的消息队列
   */
  getMessages(agentId, options = {}) {
    const queue = this.queues.get(agentId) || []
    let messages = [...queue]

    // 过滤
    if (options.type) {
      messages = messages.filter(m => m.type === options.type)
    }
    if (options.from) {
      messages = messages.filter(m => m.from === options.from)
    }
    if (options.since) {
      messages = messages.filter(m => m.timestamp > options.since)
    }

    // 排序
    messages.sort((a, b) => a.timestamp - b.timestamp)

    // 限制数量
    if (options.limit) {
      messages = messages.slice(-options.limit)
    }

    return messages
  }

  /**
   * 标记消息已读
   */
  markAsRead(agentId, messageId) {
    const message = this.messages.find(m => m.id === messageId)
    if (message && (message.to === agentId || message.mentions.includes(agentId))) {
      message.read = true
      this.emit('read', { agentId, messageId })
      return true
    }
    return false
  }

  /**
   * 获取未读消息数
   */
  getUnreadCount(agentId) {
    const messages = this.getMessages(agentId)
    return messages.filter(m => !m.read && m.to === agentId).length
  }

  /**
   * 清空 Agent 消息队列
   */
  clearQueue(agentId) {
    const queue = this.queues.get(agentId)
    if (queue) {
      queue.length = 0
      console.log(`[MessageBus] Queue cleared for ${agentId}`)
    }
  }

  /**
   * 订阅消息
   */
  subscribe(agentId, callback) {
    this.subscriptions.set(agentId, callback)
    this.on(`message:${agentId}`, callback)
    console.log(`[MessageBus] ${agentId} subscribed to messages`)
  }

  /**
   * 取消订阅
   */
  unsubscribe(agentId) {
    const callback = this.subscriptions.get(agentId)
    if (callback) {
      this.off(`message:${agentId}`, callback)
      this.subscriptions.delete(agentId)
      console.log(`[MessageBus] ${agentId} unsubscribed from messages`)
    }
  }

  /**
   * 获取消息历史
   */
  getHistory(options = {}) {
    let messages = [...this.messages]

    if (options.type) {
      messages = messages.filter(m => m.type === options.type)
    }
    if (options.agentId) {
      messages = messages.filter(m => 
        m.from === options.agentId || 
        m.to === options.agentId ||
        m.mentions.includes(options.agentId)
      )
    }
    if (options.since) {
      messages = messages.filter(m => m.timestamp > options.since)
    }
    if (options.until) {
      messages = messages.filter(m => m.timestamp < options.until)
    }

    messages.sort((a, b) => a.timestamp - b.timestamp)

    if (options.limit) {
      messages = messages.slice(-options.limit)
    }

    return messages
  }

  /**
   * 修剪历史 (防止内存溢出)
   */
  _trimHistory() {
    if (this.messages.length > this.maxHistory) {
      const removed = this.messages.splice(0, this.messages.length - this.maxHistory)
      console.log(`[MessageBus] Trimmed ${removed.length} old messages`)
    }
  }

  /**
   * 导出消息历史
   */
  exportHistory() {
    return {
      messages: this.messages.map(m => m.toJSON()),
      exportedAt: Date.now()
    }
  }

  /**
   * 导入消息历史
   */
  importHistory(data) {
    if (data.messages) {
      this.messages = data.messages.map(m => new Message(m))
      console.log(`[MessageBus] Imported ${this.messages.length} messages`)
    }
  }

  /**
   * 获取统计数据
   */
  getStats() {
    const stats = {
      totalMessages: this.messages.length,
      totalAgents: this.queues.size,
      messagesByType: {},
      messagesByAgent: {},
      averageMessagesPerAgent: 0
    }

    // 按类型统计
    for (const message of this.messages) {
      stats.messagesByType[message.type] = (stats.messagesByType[message.type] || 0) + 1
    }

    // 按 Agent 统计
    for (const [agentId, queue] of this.queues) {
      stats.messagesByAgent[agentId] = queue.length
    }

    stats.averageMessagesPerAgent = this.messages.length / (stats.totalAgents || 1)

    return stats
  }
}

/**
 * 创建讨论消息的辅助函数
 */
export function createDiscussionMessage({
  from,
  to,
  content,
  type = MessageType.TEXT,
  inReplyTo = null,
  mentions = [],
  attachments = []
}) {
  return new Message({
    from,
    to,
    type,
    content,
    priority: MessagePriority.NORMAL,
    inReplyTo,
    mentions,
    attachments
  })
}

/**
 * 创建提问消息
 */
export function createQuestionMessage({
  from,
  to,
  question,
  context = '',
  mentions = []
}) {
  return new Message({
    from,
    to,
    type: MessageType.QUESTION,
    content: question,
    priority: MessagePriority.HIGH,
    mentions,
    metadata: { context }
  })
}

/**
 * 创建回答消息
 */
export function createAnswerMessage({
  from,
  to,
  answer,
  inReplyTo,
  confidence = 1.0  // 置信度 0-1
}) {
  return new Message({
    from,
    to,
    type: MessageType.ANSWER,
    content: answer,
    inReplyTo,
    metadata: { confidence }
  })
}

/**
 * 创建请求帮助消息
 */
export function createRequestMessage({
  from,
  to,
  request,
  urgency = 'normal',
  deadline = null
}) {
  return new Message({
    from,
    to,
    type: MessageType.REQUEST,
    content: request,
    priority: urgency === 'high' ? MessagePriority.HIGH : MessagePriority.NORMAL,
    metadata: { deadline }
  })
}

// 导出单例
export const messageBus = new MessageBus()
