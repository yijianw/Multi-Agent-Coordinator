import { useState } from 'react'
import './AgentControlPanel.css'

function AgentControlPanel({ agent, onIntervention }) {
  const [showRoleEdit, setShowRoleEdit] = useState(false)
  const [newRole, setNewRole] = useState(agent.role || '')
  const [reason, setReason] = useState('')

  const getStatusBadge = (status) => {
    const badges = {
      idle: { text: '⚪ 空闲', class: 'idle' },
      running: { text: '🟢 运行', class: 'running' },
      paused: { text: '🟡 暂停', class: 'paused' },
      stopped: { text: '🔴 停止', class: 'stopped' },
      completed: { text: '✅ 完成', class: 'completed' }
    }
    return badges[status] || { text: status, class: '' }
  }

  const handlePause = () => {
    if (agent.status !== 'running') return
    const r = reason || '手动暂停'
    onIntervention(agent.id, 'pause', r)
    setReason('')
  }

  const handleResume = () => {
    if (agent.status !== 'paused') return
    const r = reason || '手动继续'
    onIntervention(agent.id, 'resume', r)
    setReason('')
  }

  const handleStop = () => {
    if (!['running', 'paused'].includes(agent.status)) return
    if (!confirm(`确定要终止 Agent "${agent.name}" 吗？`)) return
    const r = reason || '手动终止'
    onIntervention(agent.id, 'stop', r)
    setReason('')
  }

  const handleModifyRole = () => {
    if (!newRole.trim()) return
    onIntervention(agent.id, 'modify_role', '职责调整', { newRole })
    setShowRoleEdit(false)
    setNewRole('')
  }

  const handleModifyPriority = (priority) => {
    onIntervention(agent.id, 'modify_priority', '优先级调整', { priority })
  }

  const badge = getStatusBadge(agent.status)

  return (
    <div className={`agent-control-panel ${agent.status}`}>
      <div className="panel-header">
        <div className="agent-info">
          <span className="agent-icon">{agent.icon}</span>
          <span className="agent-name">{agent.name}</span>
          <span className={`status-badge ${badge.class}`}>{badge.text}</span>
        </div>
        <div className="agent-meta">
          <span className="intervention-count">干预 {agent.interventionCount || 0} 次</span>
        </div>
      </div>

      <div className="panel-body">
        {/* 职责显示 */}
        <div className="role-display">
          <strong>职责:</strong>
          {showRoleEdit ? (
            <div className="role-edit">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="输入新职责..."
              />
              <button className="btn-sm btn-primary" onClick={handleModifyRole}>✓</button>
              <button className="btn-sm" onClick={() => setShowRoleEdit(false)}>✕</button>
            </div>
          ) : (
            <div className="role-info">
              <span>{agent.role || '未设置'}</span>
              <button className="btn-link" onClick={() => setShowRoleEdit(true)}>✏️ 编辑</button>
            </div>
          )}
        </div>

        {/* 优先级 */}
        <div className="priority-display">
          <strong>优先级:</strong>
          <div className="priority-buttons">
            {['low', 'normal', 'high', 'urgent'].map(p => (
              <button
                key={p}
                className={`priority-btn ${agent.priority === p ? 'active' : ''} ${p}`}
                onClick={() => handleModifyPriority(p)}
              >
                {p === 'low' && '低'}
                {p === 'normal' && '普通'}
                {p === 'high' && '高'}
                {p === 'urgent' && '紧急'}
              </button>
            ))}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="control-buttons">
          {agent.status === 'running' && (
            <button className="btn-control pause" onClick={handlePause} disabled={agent.status !== 'running'}>
              ⏸️ 暂停
            </button>
          )}
          
          {agent.status === 'paused' && (
            <button className="btn-control resume" onClick={handleResume}>
              ▶️ 继续
            </button>
          )}
          
          {['running', 'paused'].includes(agent.status) && (
            <button className="btn-control stop" onClick={handleStop}>
              ⏹️ 终止
            </button>
          )}
        </div>

        {/* 原因输入 */}
        {(agent.status === 'running' || agent.status === 'paused') && (
          <div className="reason-input">
            <input
              type="text"
              placeholder="干预原因 (可选)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentControlPanel
