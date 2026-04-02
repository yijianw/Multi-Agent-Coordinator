#!/usr/bin/env node
/**
 * Agent 控制器测试 - 阶段 4 第三步
 * 严谨测试每个干预功能
 */

import { agentController, AgentStatus, InterventionType } from '../src/agentController.js'

async function runTests() {
  console.log('🧪 Agent Controller Tests - Phase 4 Step 3\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let passed = 0
  let failed = 0

  // 清理状态
  agentController.clear()

  // Test 1: Agent 注册
  console.log('Test 1: Agent Registration')
  try {
    let registered = false
    agentController.on('agent:registered', () => { registered = true })
    
    agentController.registerAgent('agent-test-1', AgentStatus.IDLE)
    
    const state = agentController.getAgentState('agent-test-1')
    
    if (state && state.id === 'agent-test-1' && state.status === AgentStatus.IDLE && registered) {
      console.log('  ✅ PASSED: Agent registered correctly\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Registration failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: 暂停 Agent
  console.log('Test 2: Pause Agent')
  try {
    // 先设置为运行状态
    const state = agentController.getAgentState('agent-test-1')
    state.status = AgentStatus.RUNNING
    
    let paused = false
    agentController.on('agent:paused', () => { paused = true })
    
    agentController.pauseAgent('agent-test-1', '测试暂停')
    
    const updatedState = agentController.getAgentState('agent-test-1')
    
    if (updatedState.status === AgentStatus.PAUSED && updatedState.pausedAt && paused) {
      console.log('  ✅ PASSED: Agent paused successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Pause failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 3: 继续 Agent
  console.log('Test 3: Resume Agent')
  try {
    // 确保是暂停状态
    const state = agentController.getAgentState('agent-test-1')
    state.status = AgentStatus.PAUSED
    state.pausedAt = Date.now() - 1000  // 1 秒前暂停
    
    let resumed = false
    let pauseDuration = null
    agentController.on('agent:resumed', (data) => { 
      resumed = true
      pauseDuration = data.pauseDuration
    })
    
    agentController.resumeAgent('agent-test-1', '测试继续')
    
    const updatedState = agentController.getAgentState('agent-test-1')
    
    if (updatedState.status === AgentStatus.RUNNING && updatedState.resumedAt && resumed) {
      console.log('  ✅ PASSED: Agent resumed successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Resume failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 4: 终止 Agent
  console.log('Test 4: Stop Agent')
  try {
    let stopped = false
    agentController.on('agent:stopped', () => { stopped = true })
    
    agentController.stopAgent('agent-test-1', '测试终止')
    
    const state = agentController.getAgentState('agent-test-1')
    
    if (state.status === AgentStatus.STOPPED && state.stoppedAt && stopped) {
      console.log('  ✅ PASSED: Agent stopped successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Stop failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 5: 修改职责
  console.log('Test 5: Modify Role')
  try {
    agentController.registerAgent('agent-test-2', AgentStatus.RUNNING)
    
    let roleChanged = false
    let previousRole = null
    let newRole = null
    agentController.on('agent:roleChanged', (data) => {
      roleChanged = true
      previousRole = data.previousRole
      newRole = data.newRole
    })
    
    agentController.modifyRole('agent-test-2', '高级开发者', '能力升级')
    
    const state = agentController.getAgentState('agent-test-2')
    
    if (state.role === '高级开发者' && roleChanged && newRole === '高级开发者') {
      console.log('  ✅ PASSED: Role modified successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Role modification failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 6: 修改优先级
  console.log('Test 6: Modify Priority')
  try {
    let priorityChanged = false
    agentController.on('agent:priorityChanged', () => { priorityChanged = true })
    
    agentController.modifyPriority('agent-test-2', 'high', '紧急任务')
    
    const state = agentController.getAgentState('agent-test-2')
    
    if (state.priority === 'high' && priorityChanged) {
      console.log('  ✅ PASSED: Priority modified successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Priority modification failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 7: 添加任务
  console.log('Test 7: Add Task')
  try {
    let taskAdded = false
    let addedTask = null
    agentController.on('agent:taskAdded', (data) => {
      taskAdded = true
      addedTask = data.task
    })
    
    agentController.addTask('agent-test-2', '完成单元测试', '新增需求')
    
    const state = agentController.getAgentState('agent-test-2')
    
    if (state.tasks.length === 1 && taskAdded && addedTask === '完成单元测试') {
      console.log('  ✅ PASSED: Task added successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Task addition failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 8: 干预历史
  console.log('Test 8: Intervention History')
  try {
    const history = agentController.getInterventionHistory({ limit: 10 })
    
    // 应该有 6 条干预记录 (pause, resume, stop, role, priority, task)
    if (history.length >= 6) {
      console.log('  ✅ PASSED: Intervention history recorded\n')
      passed++
    } else {
      console.log(`  ❌ FAILED: Expected >= 6 records, got ${history.length}\n`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 9: 统计数据
  console.log('Test 9: Statistics')
  try {
    const stats = agentController.getStats()
    
    const hasRequiredFields = 
      'totalAgents' in stats &&
      'byStatus' in stats &&
      'totalInterventions' in stats &&
      'interventionsByType' in stats
    
    if (hasRequiredFields && stats.totalAgents >= 2) {
      console.log('  ✅ PASSED: Statistics calculated correctly\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Statistics incomplete\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 10: 状态导出/导入
  console.log('Test 10: State Export/Import')
  try {
    const exported = agentController.exportState()
    
    // 验证导出数据结构
    const hasAgents = Array.isArray(exported.agents)
    const hasInterventions = Array.isArray(exported.interventions)
    const hasTimestamp = 'exportedAt' in exported
    
    if (hasAgents && hasInterventions && hasTimestamp) {
      console.log('  ✅ PASSED: State exported successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Export structure invalid\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 11: 错误处理 - 暂停不存在的 Agent
  console.log('Test 11: Error Handling - Non-existent Agent')
  try {
    try {
      agentController.pauseAgent('non-existent-agent')
      console.log('  ❌ FAILED: Should have thrown error\n')
      failed++
    } catch (error) {
      if (error.message.includes('not found')) {
        console.log('  ✅ PASSED: Error handling correct\n')
        passed++
      } else {
        console.log(`  ❌ FAILED: Wrong error message: ${error.message}\n`)
        failed++
      }
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 12: 错误处理 - 无效优先级
  console.log('Test 12: Error Handling - Invalid Priority')
  try {
    try {
      agentController.modifyPriority('agent-test-2', 'invalid-priority')
      console.log('  ❌ FAILED: Should have thrown error\n')
      failed++
    } catch (error) {
      if (error.message.includes('Invalid priority')) {
        console.log('  ✅ PASSED: Invalid priority rejected\n')
        passed++
      } else {
        console.log(`  ❌ FAILED: Wrong error message: ${error.message}\n`)
        failed++
      }
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`)

  // 清理
  agentController.clear()

  if (failed > 0) {
    console.log('❌ Some tests failed. Please review.\n')
    process.exit(1)
  } else {
    console.log('✅ All tests passed! Phase 4 Step 3 core logic complete.\n')
    console.log('📝 Next: Agent Control UI components\n')
    process.exit(0)
  }
}

runTests()
