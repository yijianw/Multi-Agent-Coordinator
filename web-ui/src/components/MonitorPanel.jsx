import { useEffect, useRef } from 'react'
import './MonitorPanel.css'
import AgentStatusAnimation from './AgentStatusAnimation'

function MonitorPanel({ status, logs, isRunning }) {
  const logsEndRef = useRef(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  const formatDuration = (ms) => {
    if (!ms) return '0s'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  // 转换独立服务器的状态格式为 Agent 格式
  const convertToAgentFormat = (serverStatus) => {
    const statusMap = {
      'spawning': 'idle',
      'running': 'running',
      'completed': 'completed',
      'failed': 'failed'
    }
    
    return {
      id: serverStatus.sessionKey,
      name: serverStatus.config?.label || 'Agent',
      type: serverStatus.config?.agentId || 'unknown',
      icon: getAgentIcon(serverStatus.config?.agentId),
      role: serverStatus.config?.agentId || 'Agent',
      status: statusMap[serverStatus.status] || 'idle',
      progress: serverStatus.progress || 0,
      messagesSent: serverStatus.messagesSent || 0,
      messagesReceived: serverStatus.messagesReceived || 0,
      interventionCount: 0,
      duration: serverStatus.duration || 0
    }
  }

  const getAgentIcon = (type) => {
    const icons = {
      'coder': '👨‍💻',
      'reviewer': '🔍',
      'tester': '🧪',
      'researcher': '📚',
      'doc_writer': '📝',
      'others': '🔧'
    }
    return icons[type] || '🤖'
  }

  return (
    <div className="monitor-panel">
      {/* 状态摘要 */}
      {status && (
        <div className="status-summary">
          <div className="status-item">
            <span className="label">状态:</span>
            <span className={`value ${isRunning ? 'running' : ''}`}>
              {isRunning ? '🔄 运行中' : '⏸️ 等待中'}
            </span>
          </div>
          {status.summary && (
            <>
              <div className="status-item">
                <span className="label">Agent 数量:</span>
                <span className="value">{status.summary.total || 0}</span>
              </div>
              <div className="status-item">
                <span className="label">已完成:</span>
                <span className="value">{status.summary.completed || 0}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Agent 状态卡片 - 使用新的动画组件 */}
      {status?.agents && status.agents.length > 0 && (
        <div className="agent-status-grid">
          {status.agents.map((serverAgent, index) => {
            const agent = convertToAgentFormat(serverAgent)
            return <AgentStatusAnimation key={index} agent={agent} />
          })}
        </div>
      )}

      {/* 日志流 */}
      <div className="log-panel">
        <div className="log-header">
          <h3>📋 日志流</h3>
          <span className="log-count">{logs.length} 条</span>
        </div>
        <div className="log-content">
          {logs.length === 0 ? (
            <div className="log-empty">暂无日志</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.level}`}>
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className={`log-level ${log.level}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
}

export default MonitorPanel
