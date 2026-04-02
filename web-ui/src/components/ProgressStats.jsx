import './ProgressStats.css'

function ProgressStats({ agents, sessionStart, sessionEnd }) {
  // 计算整体进度
  const overallProgress = useMemo(() => {
    if (!agents || agents.length === 0) return 0
    
    const total = agents.reduce((sum, agent) => {
      const agentProgress = agent.progress || 0
      return sum + agentProgress
    }, 0)
    
    return Math.round(total / agents.length)
  }, [agents])

  // 计算时间统计
  const timeStats = useMemo(() => {
    const start = sessionStart || Date.now()
    const end = sessionEnd || Date.now()
    const duration = end - start
    
    const hours = Math.floor(duration / 3600000)
    const minutes = Math.floor((duration % 3600000) / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    return { duration, hours, minutes, seconds }
  }, [sessionStart, sessionEnd])

  // 计算 Agent 状态统计
  const agentStats = useMemo(() => {
    if (!agents) return { total: 0, running: 0, paused: 0, completed: 0 }
    
    return {
      total: agents.length,
      running: agents.filter(a => a.status === 'running').length,
      paused: agents.filter(a => a.status === 'paused').length,
      completed: agents.filter(a => a.status === 'completed').length,
      failed: agents.filter(a => a.status === 'failed').length
    }
  }, [agents])

  // 计算效率指标
  const efficiency = useMemo(() => {
    if (!agents || agents.length === 0) return 0
    
    const activeAgents = agents.filter(a => a.status === 'running' || a.status === 'completed').length
    return Math.round((activeAgents / agents.length) * 100)
  }, [agents])

  // 格式化时间
  const formatDuration = (ms) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="progress-stats">
      <h3>📈 进度统计</h3>
      
      {/* 整体进度条 */}
      <div className="overall-progress">
        <div className="progress-header">
          <span className="progress-label">整体进度</span>
          <span className="progress-value">{overallProgress}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{formatDuration(timeStats.duration)}</div>
          <div className="stat-label">运行时长</div>
        </div>

        <div className="stat-card agents">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{agentStats.total}</div>
          <div className="stat-label">Agent 总数</div>
        </div>

        <div className="stat-card running">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{agentStats.running}</div>
          <div className="stat-label">运行中</div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{agentStats.completed}</div>
          <div className="stat-label">已完成</div>
        </div>

        <div className="stat-card paused">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{agentStats.paused}</div>
          <div className="stat-label">已暂停</div>
        </div>

        <div className="stat-card efficiency">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{efficiency}%</div>
          <div className="stat-label">效率</div>
        </div>
      </div>

      {/* Agent 详情 */}
      {agents && agents.length > 0 && (
        <div className="agent-details">
          <h4>Agent 详情</h4>
          <div className="agent-progress-list">
            {agents.map(agent => (
              <div key={agent.id} className="agent-progress-item">
                <div className="agent-info">
                  <span className="agent-icon">{agent.icon}</span>
                  <span className="agent-name">{agent.name}</span>
                  <span className={`agent-status ${agent.status}`}>
                    {agent.status === 'running' && '🟢'}
                    {agent.status === 'paused' && '🟡'}
                    {agent.status === 'completed' && '✅'}
                    {agent.status === 'failed' && '🔴'}
                    {agent.status === 'idle' && '⚪'}
                  </span>
                </div>
                <div className="agent-progress-bar">
                  <div
                    className="agent-progress-fill"
                    style={{ width: `${agent.progress || 0}%` }}
                  />
                  <span className="agent-progress-text">
                    {agent.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 添加 useMemo import
import { useMemo } from 'react'

export default ProgressStats
