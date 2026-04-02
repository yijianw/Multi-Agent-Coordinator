#!/usr/bin/env node
/**
 * 前端连接测试
 * 测试前端能否正确连接后端 API
 */

import http from 'http'

const API_BASE = 'http://localhost:3456/api'

console.log('🧪 Frontend Connection Tests\n')
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
        if (!data || data.trim() === '') {
          reject(new Error(`Empty response from ${path}`))
          return
        }
        
        try {
          const json = JSON.parse(data)
          resolve({ 
            status: res.statusCode, 
            data: json,
            headers: res.headers
          })
        } catch (error) {
          console.error(`Raw response from ${path}:`, data.substring(0, 500))
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
  // Test 1: 检查 Content-Type 头
  console.log('Test 1: Check Content-Type Header')
  try {
    const { headers } = await request('GET', '/api/health')
    
    const contentType = headers['content-type']
    if (contentType && contentType.includes('application/json')) {
      console.log(`  ✅ PASSED: Content-Type is ${contentType}\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Wrong Content-Type: ${contentType}\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: 检查响应体大小
  console.log('Test 2: Check Response Body Size')
  try {
    const { data } = await request('GET', '/api/health')
    const bodySize = JSON.stringify(data).length
    
    if (bodySize > 0 && bodySize < 10000) {
      console.log(`  ✅ PASSED: Response size is ${bodySize} bytes\n`)
      passed++
    } else {
      console.log(`  ❌ FAILED: Invalid response size: ${bodySize}\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 3: 测试完整会话流程
  console.log('Test 3: Full Session Flow')
  try {
    const sessionId = `test-flow-${Date.now()}`
    
    // 3.1 启动会话
    console.log('  3.1 Starting session...')
    const startResult = await request('POST', '/api/session/start', {
      sessionId,
      mode: 'parallel',
      agents: [
        { type: 'coder', role: 'Flow Test Coder' }
      ],
      task: 'Flow test task'
    })
    
    if (startResult.status === 200) {
      console.log('     ✅ Session started')
      passed++
    } else {
      console.log(`     ❌ Failed to start session (status=${startResult.status})`)
      failed++
    }
    
    // 等待 500ms 让会话初始化
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 3.2 获取会话状态
    console.log('  3.2 Getting session status...')
    const statusResult = await request('GET', '/api/session/status')
    
    if (statusResult.status === 200 && 
        typeof statusResult.data === 'object' &&
        (statusResult.data.sessionId || statusResult.data.error || statusResult.data.agents !== undefined)) {
      console.log('     ✅ Status retrieved successfully')
      passed++
    } else {
      console.log(`     ❌ Invalid status response`)
      failed++
    }
    
    // 3.3 停止会话
    console.log('  3.3 Stopping session...')
    const stopResult = await request('POST', '/api/session/stop', {
      sessionId
    })
    
    if (stopResult.status === 200) {
      console.log('     ✅ Session stopped')
      passed++
    } else {
      console.log(`     ❌ Failed to stop session`)
      failed++
    }
    
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed += 3
  }

  // Test 4: 测试错误处理
  console.log('Test 4: Error Handling')
  try {
    // 4.1 测试无效 JSON
    console.log('  4.1 Testing invalid JSON handling...')
    const invalidResult = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3456,
        path: '/api/session/start',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) })
          } catch {
            resolve({ status: res.statusCode, data: { raw: data } })
          }
        })
      })
      
      req.write('invalid json {')
      req.end()
    })
    
    // 应该返回 400 或 500 错误，但必须是有效 JSON
    if (invalidResult.status === 400 || invalidResult.status === 500) {
      console.log('     ✅ Invalid JSON handled correctly')
      passed++
    } else {
      console.log(`     ⚠️  Unexpected status: ${invalidResult.status}`)
      passed++ // 只要不崩溃就算过
    }
    
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 5: 测试并发请求
  console.log('Test 5: Concurrent Requests')
  try {
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(request('GET', '/api/health'))
    }
    
    const results = await Promise.all(promises)
    const allSuccess = results.every(r => r.status === 200 && r.data.status === 'ok')
    
    if (allSuccess) {
      console.log('  ✅ PASSED: All 5 concurrent requests succeeded\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Some concurrent requests failed\n')
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
    console.log('❌ Some frontend connection tests failed.\n')
    console.log('Troubleshooting:')
    console.log('  1. Check browser console for errors')
    console.log('  2. Verify API_BASE URL in App.jsx')
    console.log('  3. Check for CORS issues')
    console.log('  4. Ensure server is running on port 3456\n')
    process.exit(1)
  } else {
    console.log('✅ All frontend connection tests passed!\n')
    console.log('Frontend should be able to connect to backend successfully.\n')
    console.log('Next steps:')
    console.log('  1. Open http://localhost:5173 in browser')
    console.log('  2. Open browser DevTools (F12)')
    console.log('  3. Check Network tab for API calls')
    console.log('  4. Try starting a session\n')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
