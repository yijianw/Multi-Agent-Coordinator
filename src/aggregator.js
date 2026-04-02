/**
 * Result Aggregator - 结果聚合器模块
 * 负责收集、整理和汇总各 Agent 的执行结果
 */

import { WorkflowMode } from './orchestrator.js'

/**
 * 结果聚合器类
 */
export class ResultAggregator {
  constructor() {
    this.results = new Map()
    this.sessionId = null
  }

  /**
   * 初始化会话
   */
  initSession(sessionId) {
    this.sessionId = sessionId
    this.results.clear()
    console.log(`[Aggregator] Session ${sessionId} initialized`)
  }

  /**
   * 添加 Agent 结果
   */
  addResult(agentId, result) {
    this.results.set(agentId, {
      agentId,
      result,
      receivedAt: Date.now()
    })
    console.log(`[Aggregator] Result received from agent: ${agentId}`)
  }

  /**
   * 获取单个结果
   */
  getResult(agentId) {
    return this.results.get(agentId)
  }

  /**
   * 获取所有结果
   */
  getAllResults() {
    return Array.from(this.results.values())
  }

  /**
   * 生成汇总报告
   */
  generateReport(mode, agents) {
    const results = this.getAllResults()
    
    const report = {
      sessionId: this.sessionId,
      generatedAt: Date.now(),
      mode,
      summary: {
        totalAgents: agents.length,
        completedAgents: results.length,
        successRate: agents.length > 0 
          ? Math.round((results.length / agents.length) * 100) 
          : 0,
        totalDuration: this._calculateTotalDuration(agents),
        avgDuration: this._calculateAvgDuration(agents)
      },
      agents: agents.map(agent => {
        const result = this.results.get(agent.id)
        return {
          ...agent.toJSON(),
          result: result?.result || null
        }
      }),
      consolidated: this._consolidateResults(results, mode)
    }
    
    return report
  }

  /**
   * 根据模式整合结果
   */
  _consolidateResults(results, mode) {
    switch (mode) {
      case WorkflowMode.PIPELINE:
        return this._consolidatePipeline(results)
      case WorkflowMode.PARALLEL:
        return this._consolidateParallel(results)
      case WorkflowMode.DISCUSSION:
        return this._consolidateDiscussion(results)
      case WorkflowMode.HYBRID:
        return this._consolidateHybrid(results)
      default:
        return { type: 'unknown', data: results }
    }
  }

  /**
   * 流水线模式整合：按顺序串联结果
   */
  _consolidatePipeline(results) {
    return {
      type: 'pipeline',
      flow: results.map((r, i) => ({
        step: i + 1,
        agentId: r.agentId,
        summary: r.result?.summary || 'No result'
      })),
      finalResult: results[results.length - 1]?.result || null,
      chain: results.map(r => r.result?.details || '').join('\n\n---\n\n')
    }
  }

  /**
   * 并行模式整合：对比和汇总
   */
  _consolidateParallel(results) {
    const summaries = results.map(r => ({
      agentId: r.agentId,
      summary: r.result?.summary || 'No result'
    }))
    
    // 提取共同点和差异
    const commonThemes = this._extractCommonThemes(results.map(r => r.result))
    
    return {
      type: 'parallel',
      summaries,
      commonThemes,
      combined: results.map(r => r.result?.details || '').join('\n\n')
    }
  }

  /**
   * 讨论模式整合：整理对话和共识
   */
  _consolidateDiscussion(results) {
    return {
      type: 'discussion',
      contributions: results.map(r => ({
        agentId: r.agentId,
        contribution: r.result?.summary || 'No result'
      })),
      consensus: this._findConsensus(results.map(r => r.result)),
      openQuestions: this._extractOpenQuestions(results.map(r => r.result))
    }
  }

  /**
   * 混合模式整合：按阶段整理
   */
  _consolidateHybrid(results) {
    return {
      type: 'hybrid',
      stages: this._groupResultsByStage(results),
      overall: results.map(r => r.result?.details || '').join('\n\n')
    }
  }

  /**
   * 提取共同主题
   */
  _extractCommonThemes(results) {
    // 简化实现：返回所有结果的关键词
    const themes = new Set()
    for (const result of results) {
      if (result?.summary) {
        const words = result.summary.split(/\s+/).filter(w => w.length > 3)
        words.forEach(w => themes.add(w))
      }
    }
    return Array.from(themes).slice(0, 10)
  }

  /**
   * 寻找共识
   */
  _findConsensus(results) {
    // 简化实现：返回所有结果都提到的内容
    return 'Consensus analysis requires NLP. This is a placeholder.'
  }

  /**
   * 提取未决问题
   */
  _extractOpenQuestions(results) {
    // 简化实现：返回空数组
    return []
  }

  /**
   * 按阶段分组结果
   */
  _groupResultsByStage(results) {
    // 简化实现：所有结果放在一个阶段
    return [{
      stage: 1,
      results: results.map(r => ({ agentId: r.agentId, result: r.result }))
    }]
  }

  /**
   * 计算总时长
   */
  _calculateTotalDuration(agents) {
    if (agents.length === 0) return 0
    
    const start = Math.min(...agents.map(a => a.startedAt || Infinity))
    const end = Math.max(...agents.map(a => a.completedAt || 0))
    
    return end - start
  }

  /**
   * 计算平均时长
   */
  _calculateAvgDuration(agents) {
    if (agents.length === 0) return 0
    
    const total = agents.reduce((sum, a) => sum + a.getDuration(), 0)
    return Math.round(total / agents.length)
  }

  /**
   * 导出为 Markdown 报告
   */
  exportToMarkdown(report) {
    const lines = [
      `# Multi-Agent Session Report`,
      ``,
      `**Session ID:** ${report.sessionId}`,
      `**Mode:** ${report.mode}`,
      `**Generated:** ${new Date(report.generatedAt).toLocaleString()}`,
      ``,
      `## Summary`,
      `- Total Agents: ${report.summary.totalAgents}`,
      `- Completed: ${report.summary.completedAgents}`,
      `- Success Rate: ${report.summary.successRate}%`,
      `- Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`,
      `- Avg Duration: ${Math.round(report.summary.avgDuration / 1000)}s`,
      ``,
      `## Agent Results`,
      ``
    ]
    
    for (const agent of report.agents) {
      lines.push(
        `### ${agent.icon} ${agent.name}`,
        ``,
        `**Status:** ${agent.status}`,
        `**Progress:** ${agent.progress}%`,
        `**Duration:** ${Math.round(agent.duration / 1000)}s`,
        ``,
        `**Result:**`,
        `> ${agent.result?.summary || 'No result'}`,
        ``,
        agent.result?.details ? `**Details:**\n${agent.result.details}` : '',
        ``
      )
    }
    
    lines.push(`## Consolidated Result`, ``, report.consolidated.type, ``)
    
    return lines.join('\n')
  }
}

// 导出单例
export const aggregator = new ResultAggregator()
