#!/usr/bin/env node
/**
 * Multi-Agent Coordinator - 独立服务器
 * 不依赖 Skill 系统，直接调用 OpenClaw CLI/Gateway
 */

import http from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PORT = 3458  // 避免与 OpenClaw 主服务冲突

// Agent 会话存储
const agentSessions = new Map()

// HTTP 服务器
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  
  // CORS - 允许所有来源
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  try {
    // 路由处理
    if (url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }))
    }
    
    else if (url.pathname === '/api/spawn' && req.method === 'POST') {
      const body = await readBody(req)
      const result = await spawnAgent(body)
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    }
    
    else if (url.pathname === '/api/status' && req.method === 'GET') {
      const sessionKey = url.searchParams.get('sessionKey')
      const status = await getAgentStatus(sessionKey)
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(status))
    }
    
    else if (url.pathname === '/api/agents' && req.method === 'GET') {
      const agents = Array.from(agentSessions.values())
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ agents }))
    }
    
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
    
  } catch (error) {
    console.error('Server error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message }))
  }
})

// 读取请求体
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (e) {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

// Spawn Agent (通过 OpenClaw CLI)
async function spawnAgent(config) {
  const sessionKey = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🚀 Spawning agent: ${sessionKey}`)
  console.log(`   Task: ${config.task?.substring(0, 100)}...`)
  console.log(`   Model: ${config.model || 'default'}`)
  
  // 存储会话信息
  agentSessions.set(sessionKey, {
    sessionKey,
    status: 'spawning',
    config,
    createdAt: Date.now(),
    progress: 0,
    messagesSent: 0,
    messagesReceived: 0,
    output: ''
  })
  
  // 添加 sessionKey 到 config
  config.sessionKey = sessionKey
  
  // 异步执行 OpenClaw 命令
  executeAgentTask(sessionKey, config).catch(err => {
    console.error(`Agent ${sessionKey} failed:`, err)
    const session = agentSessions.get(sessionKey)
    if (session) {
      session.status = 'failed'
      session.error = err.message
    }
  })
  
  return {
    success: true,
    sessionKey,
    message: 'Agent spawned successfully'
  }
}

// 执行 Agent 任务 (通过 OpenClaw CLI)
async function executeAgentTask(sessionKey, config) {
  const session = agentSessions.get(sessionKey)
  if (!session) return
  
  try {
    session.status = 'running'
    session.progress = 10
    
    // 调用 OpenClaw CLI
    // 方式 1: 通过 openclaw agent 命令
    const command = buildOpenClawCommand(config)
    
    console.log(`📣 Executing: ${command}`)
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: config.runTimeoutSeconds * 1000 || 3600000,
      maxBuffer: 10 * 1024 * 1024
    })
    
    session.progress = 100
    session.status = 'completed'
    session.output = stdout
    session.messagesSent = 1
    session.messagesReceived = 1
    session.completedAt = Date.now()
    
    console.log(`✅ Agent ${sessionKey} completed`)
    
  } catch (error) {
    session.status = 'failed'
    session.error = error.message
    session.output = error.stdout || error.message
    console.error(`❌ Agent ${sessionKey} failed:`, error.message)
  }
}

// 构建 OpenClaw 命令
function buildOpenClawCommand(config) {
  // 使用 openclaw agent --session-id 执行任务
  // 参考：openclaw agent --session-id <id> --message "task" --thinking "medium"
  
  const sessionKey = config.sessionKey || `session-${Date.now()}`
  const task = config.task?.replace(/"/g, '\\"') || 'No task'
  const thinking = 'medium'  // 思考级别
  
  // 通过 openclaw agent 执行
  // 使用 --session-id 指定会话
  return `openclaw agent --session-id "${sessionKey}" --message "${task}" --thinking "${thinking}"`
}

// 获取 Agent 状态
async function getAgentStatus(sessionKey) {
  const session = agentSessions.get(sessionKey)
  
  if (!session) {
    return {
      error: 'Session not found',
      status: 'not_found'
    }
  }
  
  return {
    sessionKey: session.sessionKey,
    status: session.status,
    progress: session.progress,
    messagesSent: session.messagesSent,
    messagesReceived: session.messagesReceived,
    output: session.output,
    error: session.error,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    duration: session.completedAt ? session.completedAt - session.createdAt : Date.now() - session.createdAt
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 Multi-Agent Coordinator Server (Independent)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📡 API: http://localhost:${PORT}/api/health`)
  console.log(`📡 Spawn: POST http://localhost:${PORT}/api/spawn`)
  console.log(`📡 Status: GET http://localhost:${PORT}/api/status?sessionKey=xxx`)
  console.log(`📡 Agents: GET http://localhost:${PORT}/api/agents`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Independent server ready!')
  console.log('')
})
