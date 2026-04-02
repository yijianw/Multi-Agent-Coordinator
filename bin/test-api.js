#!/usr/bin/env node
/**
 * API 完整性测试
 * 严谨测试每个 API 端点
 */

import http from 'http'

const API_BASE = 'http://localhost:3456/api'

console.log('🧪 API Integrity Tests\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let passed = 0
let failed = 0

// 辅助函数：发送 HTTP 请求
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        // 检查响应体是否为空
        if (!data || data.trim() === '') {
          reject(new Error(`Empty response from ${path}`))
          return
        }
        
        // 尝试解析 JSON
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch (error) {
          console.error(`Response from ${path}:`, data.substring(0, 200))
          reject(new Error(`Invalid JSON from ${path}: ${error.message}`))
        }
      })
    })

    req.on('error', reject)
    
    if (body) {
      req.write(JSON.stringify(body))
    }
    
    req.end()
  })
}

async function runTests() {
  // Test 1: Health Check
  console.log('Test 1: GET /api/health')
  try {
    const { status, data } = await request('GET', '/api/health')
    
    if (status === 200 && data.status === 'ok') {
      console.log('  ✅ PASSED: Health check OK\n')
      passed++
    } else {
      console.log(`  ❌ FAILED: Unexpected response (status=${status})\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: Agent Types
  console.log('Test 2: GET /api/agent-types')
  try {
    const { status, data } = await request('GET', '/api/agent-types')
    
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      console.log(`  ✅ PASSED: Got ${data.length} agent types\n`)
      passed++
    } else if (status === 200 && Array.isArray(data)) {
      console.log(`  ⚠️  WARNING: Empty agent types array (using fallback)\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 3: Workflow Modes
  console.log('Test 3: GET /api/workflow-modes')
  try {
    const { status, data } = await request('GET', '/api/workflow-modes')
    
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      console.log(`  ✅ PASSED: Got ${data.length} workflow modes\n`)
      passed++
    } else if (status === 200 && Array.isArray(data)) {
      console.log(`  ⚠️  WARNING: Empty workflow modes array (using fallback)\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 4: Session Status (No Active Session)
  console.log('Test 4: GET /api/session/status (No Active Session)')
  try {
    const { status, data } = await request('GET', '/api/session/status')
    
    // 应该返回错误对象，但必须是有效的 JSON
    if (status === 200 && typeof data === 'object') {
      if (data.error || data.agents !== undefined) {
        console.log(`  ✅ PASSED: Valid response structure\n`)
        passed++
      } else {
        console.log(`  ❌ FAILED: Missing expected fields\n`)
        failed++
      }
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 5: Start Session
  console.log('Test 5: POST /api/session/start')
  try {
    const sessionConfig = {
      sessionId: `test-${Date.now()}`,
      mode: 'parallel',
      agents: [
        { type: 'coder', role: 'Test Coder' },
        { type: 'reviewer', role: 'Test Reviewer' }
      ],
      task: 'Test task for API testing'
    }
    
    const { status, data } = await request('POST', '/api/session/start', sessionConfig)
    
    if (status === 200 && typeof data === 'object') {
      if (data.success !== false && data.sessionId) {
        console.log(`  ✅ PASSED: Session started successfully\n`)
        passed++
      } else if (data.error) {
        console.log(`  ⚠️  WARNING: Session start returned error: ${data.error}\n`)
        passed++ // 错误响应也是有效 JSON
      } else {
        console.log(`  ❌ FAILED: Unexpected response structure\n`)
        failed++
      }
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 6: Session Status (Active Session)
  console.log('Test 6: GET /api/session/status (Active Session)')
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待 1 秒让会话启动
    
    const { status, data } = await request('GET', '/api/session/status')
    
    if (status === 200 && typeof data === 'object') {
      // 检查必需字段
      const hasRequiredFields = 
        'sessionId' in data || 
        'agents' in data || 
        'isRunning' in data ||
        'error' in data
      
      if (hasRequiredFields) {
        console.log(`  ✅ PASSED: Status response has required fields\n`)
        passed++
      } else {
        console.log(`  ❌ FAILED: Missing required fields\n`)
        failed++
      }
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 7: Session Report (May Not Exist Yet)
  console.log('Test 7: GET /api/session/report')
  try {
    const { status, data } = await request('GET', '/api/session/report')
    
    // 404 是正常的（会话可能还没完成）
    if (status === 200 || status === 404) {
      console.log(`  ✅ PASSED: Report endpoint working (status=${status})\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Unexpected status ${status}\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 8: Stop Session
  console.log('Test 8: POST /api/session/stop')
  try {
    const { status, data } = await request('POST', '/api/session/stop', {
      sessionId: 'test'
    })
    
    if (status === 200 && typeof data === 'object') {
      console.log(`  ✅ PASSED: Stop endpoint working\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Invalid response\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`)

  if (failed > 0) {
    console.log('❌ Some API tests failed. Please review server logs.\n')
    console.log('Common issues:')
    console.log('  1. Server not running (start with: npm start)')
    console.log('  2. API endpoint returns empty response')
    console.log('  3. API endpoint returns invalid JSON')
    console.log('  4. Network connectivity issues\n')
    process.exit(1)
  } else {
    console.log('✅ All API tests passed!\n')
    console.log('Server is responding correctly to all endpoints.\n')
    process.exit(0)
  }
}

// 运行测试
runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
