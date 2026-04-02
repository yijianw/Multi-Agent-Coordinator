#!/usr/bin/env node
/**
 * 启动脚本 - 启动 Multi-Agent Coordinator 服务
 */

import { coordinator } from '../src/index.js'
import { httpServer } from '../server/index.js'

async function main() {
  console.log('📜 Multi-Agent Coordinator Starting...\n')

  try {
    // 1. 初始化 Coordinator
    console.log('📦 Initializing Coordinator...')
    const initResult = await coordinator.init()
    
    if (!initResult.success) {
      throw new Error(`Coordinator init failed: ${initResult.error}`)
    }
    
    console.log('✅ Coordinator initialized')
    console.log(`   Agent Types: ${initResult.config.agentTypes.join(', ')}`)
    console.log(`   Workflow Modes: ${initResult.config.workflowModes.join(', ')}\n`)

    // 2. 启动 HTTP 服务器
    console.log('🌐 Starting HTTP Server...')
    await httpServer.start()
    console.log(`✅ HTTP Server running on http://localhost:${httpServer.port}\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ Multi-Agent Coordinator is ready!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📡 API: http://localhost:${httpServer.port}/api/health`)
    console.log(`🌍 Web UI: http://localhost:${httpServer.port}/`)
    console.log(`📡 WebSocket: ws://localhost:${3457}/\n`)
    console.log('Press Ctrl+C to stop\n')

  } catch (error) {
    console.error('❌ Failed to start:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...')
  httpServer.stop().then(() => {
    process.exit(0)
  })
})

main()
