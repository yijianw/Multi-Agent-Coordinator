import { useState, useEffect } from 'react'
import './SessionHistory.css'

function SessionHistory({ onSelectSession, onClearHistory }) {
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    try {
      const data = localStorage.getItem('mac_sessions')
      const sessions = data ? JSON.parse(data) : []
      setSessions(sessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const handleSelectSession = (session) => {
    if (onSelectSession) {
      onSelectSession(session)
    }
  }

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation()
    try {
      const updated = sessions.filter(s => s.id !== sessionId)
      localStorage.setItem('mac_sessions', JSON.stringify(updated))
      setSessions(updated)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      localStorage.removeItem('mac_sessions')
      setSessions([])
      if (onClearHistory) {
        onClearHistory()
      }
    }
  }

  const handleExport = () => {
    const data = {
      sessions,
      exportedAt: Date.now()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mac-sessions-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.mode === filter
    const matchesSearch = searchTerm === '' || 
      session.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionId?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="status-badge completed">✅ 完成</span>
      case 'failed': return <span className="status-badge failed">❌ 失败</span>
      case 'stopped': return <span className="status-badge stopped">⏹️ 停止</span>
      case 'running': return <span className="status-badge running">🔄 运行中</span>
      default: return <span className="status-badge">⚪ 未知</span>
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const formatDuration = (ms) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="session-history">
      <div className="history-header">
        <h2>📜 历史记录</h2>
        <div className="header-actions">
          <button className="btn btn-sm" onClick={handleExport}>📥 导出</button>
          <button className="btn btn-sm btn-danger" onClick={handleClearHistory}>🗑️ 清空</button>
        </div>
      </div>

      <div className="history-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 搜索会话 ID 或任务..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部模式</option>
          <option value="pipeline">流水线</option>
          <option value="parallel">并行</option>
          <option value="discussion">讨论</option>
          <option value="hybrid">混合</option>
        </select>
      </div>

      <div className="history-stats">
        <span>共 {filteredSessions.length} 条记录</span>
        {sessions.length > 0 && (
          <span>
            成功率：{Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)}%
          </span>
        )}
      </div>

      <div className="history-list">
        {filteredSessions.length === 0 ? (
          <div className="history-empty">
            {sessions.length === 0 ? '暂无历史记录' : '没有匹配的会话'}
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              className="history-item"
              onClick={() => handleSelectSession(session)}
            >
              <div className="history-item-header">
                <span className="session-id">{session.sessionId}</span>
                {getStatusBadge(session.status)}
              </div>
              <div className="history-item-body">
                <div className="history-task">
                  <strong>任务:</strong> {session.task || '-'}
                </div>
                <div className="history-meta">
                  <span>📅 {formatTime(session.createdAt)}</span>
                  <span>⏱️ {formatDuration(session.totalDuration)}</span>
                  <span>🔧 {session.agents?.length || 0} Agents</span>
                  <span>🎯 {session.mode}</span>
                </div>
              </div>
              <div className="history-item-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectSession(session)
                  }}
                >
                  查看详情
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SessionHistory
