/**
 * Communication Bus - 通信总线模块
 * 负责 WebSocket 实时推送和消息管理
 */

import { WebSocketServer } from 'ws'
import { EventEmitter } from 'events'

/**
 * 通信总线类
 */
export class CommunicationBus extends EventEmitter {
  constructor(wsPort = 3457) {
    super()
    this.wsPort = wsPort
    this.wss = null
    this.clients = new Set()
    this.messageBuffer = []
    this.maxBufferSize = 100
  }

  /**
   * 启动 WebSocket 服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.wsPort })
        
        this.wss.on('listening', () => {
          console.log(`[CommunicationBus] WebSocket server listening on port ${this.wsPort}`)
          resolve()
        })
        
        this.wss.on('connection', (ws) => {
          this._handleConnection(ws)
        })
        
        this.wss.on('error', (error) => {
          console.error('[CommunicationBus] WebSocket server error:', error)
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 处理新连接
   */
  _handleConnection(ws) {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.clients.add(ws)
    
    console.log(`[CommunicationBus] Client connected: ${clientId}`)
    
    // 发送历史消息缓冲区
    if (this.messageBuffer.length > 0) {
      ws.send(JSON.stringify({
        type: 'history',
        messages: this.messageBuffer
      }))
    }
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        this.emit('clientMessage', { clientId, ws, message })
      } catch (error) {
        console.error('[CommunicationBus] Failed to parse client message:', error)
      }
    })
    
    ws.on('close', () => {
      this.clients.delete(ws)
      console.log(`[CommunicationBus] Client disconnected: ${clientId}`)
    })
    
    ws.on('error', (error) => {
      console.error('[CommunicationBus] Client error:', error)
      this.clients.delete(ws)
    })
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(message) {
    const payload = JSON.stringify(message)
    const timestamp = Date.now()
    
    // 添加到历史缓冲区
    this._addToBuffer({ ...message, timestamp })
    
    // 广播给所有连接的客户端
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  /**
   * 发送到特定客户端
   */
  sendTo(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  /**
   * 添加到消息缓冲区
   */
  _addToBuffer(message) {
    this.messageBuffer.push(message)
    
    // 限制缓冲区大小
    if (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer.shift()
    }
  }

  /**
   * 停止服务器
   */
  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('[CommunicationBus] WebSocket server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 获取连接数
   */
  getClientCount() {
    return this.clients.size
  }
}

/**
 * 消息类型枚举
 */
export const MessageType = {
  STATUS_UPDATE: 'status_update',
  LOG: 'log',
  AGENT_RESULT: 'agent_result',
  SESSION_COMPLETE: 'session_complete',
  ERROR: 'error',
  CLIENT_COMMAND: 'client_command'
}

/**
 * 创建消息辅助函数
 */
export function createMessage(type, payload) {
  return {
    type,
    payload,
    timestamp: Date.now()
  }
}

// 导出单例
export const communicationBus = new CommunicationBus()
