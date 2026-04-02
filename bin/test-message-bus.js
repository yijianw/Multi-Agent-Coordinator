#!/usr/bin/env node
/**
 * 消息总线测试 - 阶段 4 第一步
 */

import { messageBus, MessageType, createQuestionMessage, createAnswerMessage } from '../src/messageBus.js'
import { orchestrator, WorkflowMode } from '../src/orchestrator.js'
import { agentFactory } from '../src/agentFactory.js'

async function runTests() {
  console.log('🧪 Message Bus Tests - Phase 4 Step 1\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let passed = 0
  let failed = 0

  // Test 1: 消息总线基础功能
  console.log('Test 1: Message Bus Basic Operations')
  try {
    // 注册 Agent
    messageBus.registerAgent('agent-1')
    messageBus.registerAgent('agent-2')
    messageBus.registerAgent('agent-3')
    
    // 发送点对点消息
    const msg1 = messageBus.sendMessage({
      from: 'agent-1',
      to: 'agent-2',
      type: MessageType.TEXT,
      content: 'Hello Agent-2!'
    })
    
    // 验证消息已投递
    const agent2Messages = messageBus.getMessages('agent-2')
    if (agent2Messages.length === 1 && agent2Messages[0].from === 'agent-1') {
      console.log('  ✅ PASSED: Point-to-point message delivered\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Message not delivered correctly\n')
      failed++
    }
    
    // 清理
    messageBus.unregisterAgent('agent-1')
    messageBus.unregisterAgent('agent-2')
    messageBus.unregisterAgent('agent-3')
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 2: 广播消息
  console.log('Test 2: Broadcast Message')
  try {
    messageBus.registerAgent('agent-A')
    messageBus.registerAgent('agent-B')
    messageBus.registerAgent('agent-C')
    
    // 发送广播消息 (to=null)
    messageBus.sendMessage({
      from: 'agent-A',
      to: null,
      type: MessageType.TEXT,
      content: 'Hello everyone!'
    })
    
    // 验证 B 和 C 都收到了消息
    const messagesB = messageBus.getMessages('agent-B')
    const messagesC = messageBus.getMessages('agent-C')
    const messagesA = messageBus.getMessages('agent-A') // A 不应该收到自己的广播
    
    if (messagesB.length === 1 && messagesC.length === 1 && messagesA.length === 0) {
      console.log('  ✅ PASSED: Broadcast message delivered to all except sender\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Broadcast not working correctly\n')
      failed++
    }
    
    messageBus.unregisterAgent('agent-A')
    messageBus.unregisterAgent('agent-B')
    messageBus.unregisterAgent('agent-C')
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 3: 消息类型
  console.log('Test 3: Message Types')
  try {
    messageBus.registerAgent('questioner')
    messageBus.registerAgent('answerer')
    
    // 发送提问消息
    const question = createQuestionMessage({
      from: 'questioner',
      to: 'answerer',
      question: 'How to implement authentication?',
      context: 'Working on login module'
    })
    
    messageBus.sendMessage(question)
    
    // 发送回答消息
    const answer = createAnswerMessage({
      from: 'answerer',
      to: 'questioner',
      answer: 'Use JWT tokens with refresh rotation',
      inReplyTo: question.id,
      confidence: 0.95
    })
    
    messageBus.sendMessage(answer)
    
    // 验证消息类型
    const history = messageBus.getHistory({ agentId: 'questioner' })
    const hasQuestion = history.some(m => m.type === MessageType.QUESTION)
    const hasAnswer = history.some(m => m.type === MessageType.ANSWER)
    
    if (hasQuestion && hasAnswer) {
      console.log('  ✅ PASSED: Question and Answer messages created\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Message types not correct\n')
      failed++
    }
    
    messageBus.unregisterAgent('questioner')
    messageBus.unregisterAgent('answerer')
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 4: 消息历史
  console.log('Test 4: Message History')
  try {
    messageBus.registerAgent('h1')
    messageBus.registerAgent('h2')
    
    // 发送多条消息
    for (let i = 0; i < 5; i++) {
      messageBus.sendMessage({
        from: 'h1',
        to: 'h2',
        content: `Message ${i}`
      })
    }
    
    // 获取历史
    const history = messageBus.getHistory({ agentId: 'h2', limit: 10 })
    
    if (history.length === 5) {
      console.log('  ✅ PASSED: Message history retrieved correctly\n')
      passed++
    } else {
      console.log(`  ❌ FAILED: Expected 5 messages, got ${history.length}\n`)
      failed++
    }
    
    messageBus.unregisterAgent('h1')
    messageBus.unregisterAgent('h2')
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 5: 讨论模式集成
  console.log('Test 5: Discussion Mode Integration')
  try {
    agentFactory.clear()
    const sessionId = 'test-discussion'
    const agentConfigs = [
      { type: 'coder', role: 'Coder A' },
      { type: 'reviewer', role: 'Reviewer B' },
      { type: 'tester', role: 'Tester C' }
    ]
    
    orchestrator.initSession(sessionId, WorkflowMode.DISCUSSION, agentConfigs)
    
    // 手动注册 Agent (模拟_runDiscussion 的行为)
    for (const agent of orchestrator.agents) {
      messageBus.registerAgent(agent.id)
    }
    
    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 验证 Agent 已注册到消息总线
    const stats = messageBus.getStats()
    if (stats.totalAgents === 3) {
      console.log('  ✅ PASSED: Agents registered to message bus\n')
      passed++
    } else {
      console.log(`  ❌ FAILED: Expected 3 agents, got ${stats.totalAgents}\n`)
      failed++
    }
    
    // 模拟发送消息
    const agentA = orchestrator.agents[0]
    const agentB = orchestrator.agents[1]
    
    orchestrator.sendMessage(agentA.id, agentB.id, 'Can you review my code?')
    
    const messagesB = messageBus.getMessages(agentB.id)
    if (messagesB.length > 0) {
      console.log('  ✅ PASSED: Message sent between agents\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Message not sent\n')
      failed++
    }
    
    // 清理
    for (const agent of orchestrator.agents) {
      messageBus.unregisterAgent(agent.id)
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 6: 消息统计
  console.log('Test 6: Message Statistics')
  try {
    // 清理之前的消息
    messageBus.messages = []
    
    messageBus.registerAgent('stats-1')
    messageBus.registerAgent('stats-2')
    
    // 发送不同类型的消息
    messageBus.sendMessage({ from: 'stats-1', to: 'stats-2', type: MessageType.TEXT, content: 'Text' })
    messageBus.sendMessage({ from: 'stats-1', to: 'stats-2', type: MessageType.QUESTION, content: 'Question?' })
    messageBus.sendMessage({ from: 'stats-2', to: 'stats-1', type: MessageType.ANSWER, content: 'Answer' })
    
    const stats = messageBus.getStats()
    
    if (stats.totalMessages === 3 && 
        stats.totalAgents === 2 &&
        stats.messagesByType[MessageType.TEXT] === 1 &&
        stats.messagesByType[MessageType.QUESTION] === 1 &&
        stats.messagesByType[MessageType.ANSWER] === 1) {
      console.log('  ✅ PASSED: Message statistics correct\n')
      passed++
    } else {
      console.log('  ❌ FAILED: Statistics not correct\n')
      failed++
      console.log('  Stats:', JSON.stringify(stats, null, 2))
    }
    
    messageBus.unregisterAgent('stats-1')
    messageBus.unregisterAgent('stats-2')
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`)
    failed++
  }

  // Test 7: 消息已读标记
  console.log('Test 7: Message Read Status')
  try {
    messageBus.registerAgent('reader')
    messageBus.registerAgent('sender')
    
    const msg = messageBus.sendMessage({
      from: 'sender',
      to: 'reader',
      content: 'Read me!'
    })
    
    // 初始未读
    const unreadBefore = messageBus.getUnreadCount('reader')
    
    // 标记已读
    messageBus.markAsRead('reader', msg.id)
    
    // 验证已读
    const unreadAfter = messageBus.getUnreadCount('reader')
    
    if (unreadBefore === 1 && unreadAfter === 0) {
      console.log('  ✅ PASSED: Message read status updated\n')
      passed++
    } else {
      console.log(`  ❌ FAILED: Expected 1->0, got ${unreadBefore}->${unreadAfter}\n`)
      failed++
    }
    
    messageBus.unregisterAgent('reader')
    messageBus.unregisterAgent('sender')
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
    console.log('✅ All tests passed! Phase 4 Step 1 complete.\n')
    console.log('📝 Next: Discussion Mode UI - Message Display\n')
    process.exit(0)
  }
}

runTests()
