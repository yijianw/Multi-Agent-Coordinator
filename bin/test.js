#!/usr/bin/env node
/**
 * 测试脚本 - 阶段 1 核心功能测试
 */

import { coordinator } from '../src/index.js'
import { agentFactory } from '../src/agentFactory.js'
import { orchestrator, WorkflowMode } from '../src/orchestrator.js'
import { aggregator } from '../src/aggregator.js'

async function runTests() {
  console.log('🧪 Multi-Agent Coordinator - Phase 1 Tests\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let passed = 0
  let failed = 0

  // Test 1: Agent Factory
  console.log('Test 1: Agent Factory')
  try {
    const agent1 = agentFactory.createAgent('coder', {
      role: 'Frontend Coder',
      enhancedPrompt: 'Use React and TypeScript'
    })
    
    const agent2 = agentFactory.createAgent('reviewer')
    
    if (agent1.id && agent2.id && agent1.type === 'coder') {
      console.log('  ✅ PASSED: Agents created successfully\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Agent creation failed\n')
      failed++
    }
    
    agentFactory.clear()
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: Agent System Prompt
  console.log('Test 2: Agent System Prompt Generation')
  try {
    const agent = agentFactory.createAgent('coder', {
      enhancedPrompt: 'Use functional programming'
    })
    
    const prompt = agent.getSystemPrompt()
    
    if (prompt.includes('资深软件工程师') && prompt.includes('functional programming')) {
      console.log('  ✅ PASSED: System prompt generated correctly\n')
      passed++
    } else {
      console.log('  ❌ FAILED: System prompt missing content\n')
      failed++
    }
    
    agentFactory.clear()
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 3: Orchestrator Initialization
  console.log('Test 3: Orchestrator Initialization')
  try {
    const sessionId = 'test-session-1'
    const agentConfigs = [
      { type: 'coder', role: 'Test Coder' },
      { type: 'reviewer', role: 'Test Reviewer' }
    ]
    
    const result = orchestrator.initSession(sessionId, WorkflowMode.PARALLEL, agentConfigs)
    
    if (result.sessionId === sessionId && result.agentCount === 2) {
      console.log('  ✅ PASSED: Orchestrator initialized\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Orchestrator init failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 4: Parallel Execution (Simulated)
  console.log('Test 4: Parallel Workflow Execution')
  try {
    const statusUpdates = []
    
    orchestrator.onStatusChange = (status) => {
      statusUpdates.push(status)
    }
    
    await orchestrator.start('Test task for parallel execution')
    
    const allCompleted = orchestrator.agents.every(a => a.status === 'completed')
    
    if (allCompleted && statusUpdates.length > 0) {
      console.log('  ✅ PASSED: Parallel workflow executed\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Parallel workflow failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 5: Result Aggregation
  console.log('Test 5: Result Aggregation')
  try {
    aggregator.initSession('test-session-1')
    
    for (const agent of orchestrator.agents) {
      aggregator.addResult(agent.id, agent.result)
    }
    
    const report = aggregator.generateReport(WorkflowMode.PARALLEL, orchestrator.agents)
    
    if (report.summary.totalAgents === 2 && report.agents.length === 2) {
      console.log('  ✅ PASSED: Results aggregated\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Aggregation failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 6: Markdown Export
  console.log('Test 6: Markdown Report Export')
  try {
    const reportForExport = aggregator.generateReport(WorkflowMode.PARALLEL, orchestrator.agents)
    const markdown = aggregator.exportToMarkdown(reportForExport)
    
    if (markdown.includes('# Multi-Agent Session Report') && markdown.includes('## Summary')) {
      console.log('  ✅ PASSED: Markdown exported\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Markdown export failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 7: Pipeline Mode
  console.log('Test 7: Pipeline Workflow Mode')
  try {
    agentFactory.clear()
    const sessionId = 'test-pipeline'
    const agentConfigs = [
      { type: 'researcher', role: 'Researcher' },
      { type: 'coder', role: 'Coder' },
      { type: 'reviewer', role: 'Reviewer' }
    ]
    
    orchestrator.initSession(sessionId, WorkflowMode.PIPELINE, agentConfigs)
    await orchestrator.start('Research, then code, then review')
    
    const statuses = orchestrator.agents.map(a => a.status)
    const allCompleted = statuses.every(s => s === 'completed')
    
    if (allCompleted) {
      console.log('  ✅ PASSED: Pipeline workflow executed\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Pipeline workflow failed\n')
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 8: Hybrid Mode with DAG
  console.log('Test 8: Hybrid Workflow with DAG')
  try {
    agentFactory.clear()
    const sessionId = 'test-hybrid'
    const agentConfigs = [
      { type: 'researcher', role: 'Researcher A' },
      { type: 'researcher', role: 'Researcher B' },
      { type: 'coder', role: 'Coder C' },
      { type: 'reviewer', role: 'Reviewer D' }
    ]
    
    const dag = {
      stages: [
        {
          type: 'parallel',
          agents: ['researcher'],
          sync: true
        },
        {
          type: 'pipeline',
          agents: ['coder', 'reviewer'],
          dependencies: ['researcher']
        }
      ]
    }
    
    orchestrator.initSession(sessionId, WorkflowMode.HYBRID, agentConfigs, dag)
    await orchestrator.start('Hybrid workflow test')
    
    const allCompleted = orchestrator.agents.every(a => a.status === 'completed')
    
    if (allCompleted) {
      console.log('  ✅ PASSED: Hybrid workflow executed\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Hybrid workflow failed\n')
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
    console.log('❌ Some tests failed. Please review.\n')
    process.exit(1)
  } else {
    console.log('✅ All tests passed! Phase 1 complete.\n')
    process.exit(0)
  }
}

runTests()
