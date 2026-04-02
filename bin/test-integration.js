#!/usr/bin/env node
/**
 * 集成测试 - 测试独立服务器 + Web UI
 */

import http from 'http'

const API_BASE = 'http://localhost:3458/api'

console.log('🧪 Integration Tests - Independent Server + Web UI\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let passed = 0
let failed = 0

// 辅助函数
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runTests() {
  // Test 1: Health Check
  console.log('Test 1: Server Health Check')
  try {
    const { status, data } = await request('GET', '/health')
    if (status === 200 && data.status === 'ok') {
      console.log('  ✅ PASSED: Server is healthy\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Server returned error\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: Spawn Single Agent
  console.log('Test 2: Spawn Single Agent')
  try {
    const { status, data } = await request('POST', '/spawn', {
      task: 'Write a Hello World program in Python',
      agentId: 'coder',
      model: 'bailian/qwen3.5-plus',
      runTimeoutSeconds: 60
    })
    
    if (status === 200 && data.success && data.sessionKey) {
      console.log(`  ✅ PASSED: Agent spawned (${data.sessionKey})\n`)
      passed++
      
      // Test 3: Check Status
      console.log('Test 3: Check Agent Status')
      setTimeout(async () => {
        try {
          const { data: statusData } = await request('GET', `/status?sessionKey=${data.sessionKey}`)
          
          if (statusData.sessionKey && statusData.status) {
            console.log(`  ✅ PASSED: Status retrieved (status: ${statusData.status})\n`)
            passed++
            
            // Test 4: Get All Agents
            console.log('Test 4: Get All Agents')
            const { data: agentsData } = await request('GET', '/agents')
            
            if (agentsData.agents && Array.isArray(agentsData.agents)) {
              console.log(`  ✅ PASSED: Got ${agentsData.agents.length} agents\n`)
              passed++
            } else {
              console.log('  ❌ FAILED: Invalid agents response\n')
              failed++
            }
            
            printSummary()
          } else {
            console.log('  ❌ FAILED: Invalid status response\n')
            failed++
            printSummary()
          }
        } catch (error) {
          console.log(`  ❌ FAILED: ${error.message}\n`)
          failed++
          printSummary()
        }
      }, 3000)
      
      return // 等待回调
      
    } else {
      console.log('  ❌ FAILED: Spawn failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }
  
  printSummary()
}

function printSummary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`)
  
  if (failed > 0) {
    console.log('❌ Some tests failed.\n')
    process.exit(1)
  } else {
    console.log('✅ All tests passed!\n')
    console.log('📝 Next: Test Web UI integration\n')
    console.log('1. Open http://localhost:5173/\n')
    console.log('2. Create 2-3 agents\n')
    console.log('3. Enter a task description\n')
    console.log('4. Click "🚀 启动会话"\n')
    console.log('5. Observe real agent execution\n')
    process.exit(0)
  }
}

runTests().catch(console.error)
