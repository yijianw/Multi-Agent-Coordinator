import './AgentStatusAnimation.css'

/**
 * Agent 状态动画组件
 * 参考 Star-Office-UI 的像素风格 + Claude Code 的 Task 状态管理
 */

// 状态映射 (参考 Claude Code Task.ts)
const STATUS_CONFIG = {
  idle: {
    label: '空闲',
    color: '#6b7280',
    bgColor: 'rgba(107, 119, 128, 0.2)',
    icon: '⚪',
    animation: 'none'
  },
  running: {
    label: '工作中',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.2)',
    icon: '🟢',
    animation: 'pulse-working'
  },
  paused: {
    label: '已暂停',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.2)',
    icon: '🟡',
    animation: 'pulse-slow'
  },
  stopped: {
    label: '已停止',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    icon: '🔴',
    animation: 'none'
  },
  completed: {
    label: '已完成',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    icon: '✅',
    animation: 'celebrate'
  },
  failed: {
    label: '失败',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.2)',
    icon: '❌',
    animation: 'shake'
  }
}

// Agent 类型图标映射
const AGENT_TYPE_ICONS = {
  coder: '👨‍💻',
  reviewer: '🔍',
  tester: '🧪',
  researcher: '📚',
  doc_writer: '📝',
  others: '🔧'
}

function AgentStatusAnimation({ agent }) {
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle
  const agentIcon = AGENT_TYPE_ICONS[agent.type] || agent.icon || '🤖'

  return (
    <div className={`agent-status-card ${agent.status}`}>
      {/* 状态指示器 */}
      <div className="status-header">
        <div className="agent-avatar">
          <span className="agent-icon">{agentIcon}</span>
        </div>
        <div className="agent-basic-info">
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
        </div>
        <div className={`status-indicator ${agent.status}`}>
          <span className="status-dot"></span>
          <span className="status-label">{statusConfig.label}</span>
        </div>
      </div>

      {/* 进度条 */}
      {agent.progress !== undefined && (
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">进度</span>
            <span className="progress-value">{agent.progress}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${agent.status}`}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 任务信息 */}
      {agent.currentTask && (
        <div className="current-task">
          <div className="task-label">当前任务</div>
          <div className="task-content">{agent.currentTask}</div>
        </div>
      )}

      {/* 统计指标 */}
      <div className="metrics-grid">
        <div className="metric-item">
          <div className="metric-value">{agent.messagesSent || 0}</div>
          <div className="metric-label">发送消息</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">{agent.messagesReceived || 0}</div>
          <div className="metric-label">接收消息</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">{agent.interventionCount || 0}</div>
          <div className="metric-label">干预次数</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">
            {agent.duration ? Math.round(agent.duration / 1000) : 0}s
          </div>
          <div className="metric-label">运行时长</div>
        </div>
      </div>

      {/* 状态动画背景 */}
      <div className={`status-animation ${agent.status}`}>
        {agent.status === 'running' && (
          <div className="working-particles">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="particle" style={{ '--delay': `${i * 0.2}s` }} />
            ))}
          </div>
        )}
        {agent.status === 'completed' && (
          <div className="celebrate-confetti">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  '--delay': `${i * 0.1}s`,
                  '--color': ['#ffd700', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 5]
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentStatusAnimation
