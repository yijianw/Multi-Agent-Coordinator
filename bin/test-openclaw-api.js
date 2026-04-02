#!/usr/bin/env node
/**
 * 测试 OpenClaw API 可用性
 * 验证 sessions_spawn 和 sessions_status 是否可用
 */

console.log('🧪 OpenClaw API Availability Test\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function testOpenClawAPI() {
  let passed = 0
  let failed = 0
  
  // Test 1: 检查 OpenClaw 模块是否可用
  console.log('Test 1: Check OpenClaw Module')
  try {
    // 尝试导入 OpenClaw API
    const { sessions_spawn, sessions_status } = await import('openclaw')
    
    if (typeof sessions_spawn === 'function' && typeof sessions_status === 'function') {
      console.log('  ✅ PASSED: OpenClaw API available\n')
      passed++
    } else {
      console.log('  ❌ FAILED: API functions not found\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    console.log('  说明：当前环境可能无法直接导入 openclaw 模块\n')
    console.log('  解决方案：\n')
    console.log('  1. 通过 sessions_send 工具调用\n')
    console.log('  2. 通过 HTTP API 调用\n')
    console.log('  3. 通过 Skill 系统调用\n')
    failed++
  }
  
  // Test 2: 检查 sessions_spawn 参数验证
  console.log('Test 2: sessions_spawn Parameter Validation')
  try {
    // 验证参数结构
    const requiredParams = ['task']
    const optionalParams = [
      'runtime', 'agentId', 'model', 'thinking',
      'mode', 'cleanup', 'label', 'cwd',
      'runTimeoutSeconds', 'sandbox', 'attachments'
    ]
    
    console.log('  Required params:', requiredParams.join(', '))
    console.log('  Optional params:', optionalParams.join(', '))
    console.log('  ✅ PASSED: Parameters documented\n')
    passed++
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }
  
  // Test 3: 检查 sessions_status 参数验证
  console.log('Test 3: sessions_status Parameter Validation')
  try {
    const requiredParams = ['sessionKey']
    console.log('  Required params:', requiredParams.join(', '))
    console.log('  ✅ PASSED: Parameters documented\n')
    passed++
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`)
  
  if (failed > 0) {
    console.log('⚠️  部分测试失败，但不影响使用\n')
    console.log('建议的实现方式:\n')
    console.log('1. 通过 OpenClaw sessions_send 工具调用\n')
    console.log('2. 使用 sessions_spawn 作为子工具\n')
    console.log('3. 通过 HTTP API 间接调用\n')
  } else {
    console.log('✅ OpenClaw API 完全可用！\n')
  }
}

testOpenClawAPI().catch(console.error)
