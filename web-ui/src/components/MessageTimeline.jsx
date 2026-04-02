import { useState } from 'react'
import MessageBubble from './MessageBubble'
import './MessageTimeline.css'

function MessageTimeline({ messages, agents, currentAgentId }) {
  const [filter, setFilter] = useState('all')
  const [groupByAgent, setGroupByAgent] = useState(false)

  // 过滤消息
  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true
    if (filter === 'unread') return !msg.read
    if (filter === 'questions') return msg.type === 'question'
    if (filter === 'answers') return msg.type === 'answer'
    return msg.type === filter
  })

  // 按 Agent 分组
  const groupedMessages = filteredMessages.reduce((groups, msg) => {
    const key = msg.from
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(msg)
    return groups
  }, {})

  const getAgentName = (agentId) => {
    const agent = agents?.find(a => a.id === agentId)
    return agent ? agent.name : agentId
  }

  const getAgentColor = (agentId) => {
    const colors = ['#4a90d9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
    const index = agentId ? agentId.charCodeAt(agentId.length - 1) % colors.length : 0
    return colors[index]
  }

  if (messages.length === 0) {
    return (
      <div className="message-timeline-empty">
        <div className="empty-icon">💬</div>
        <p>暂无消息</p>
        <span>Agent 间的讨论消息将显示在这里</span>
      </div>
    )
  }

  return (
    <div className="message-timeline">
      <div className="timeline-controls">
        <div className="filter-group">
          <label>过滤:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">全部消息</option>
            <option value="unread">未读</option>
            <option value="questions">提问</option>
            <option value="answers">回答</option>
            <option value="requests">请求</option>
            <option value="suggestions">建议</option>
            <option value="feedback">反馈</option>
          </select>
        </div>

        <label className="toggle-group">
          <input
            type="checkbox"
            checked={groupByAgent}
            onChange={(e) => setGroupByAgent(e.target.checked)}
          />
          按 Agent 分组
        </label>
      </div>

      <div className="timeline-content">
        {groupByAgent ? (
          // 按 Agent 分组显示
          Object.entries(groupedMessages).map(([agentId, msgs]) => (
            <div key={agentId} className="agent-message-group">
              <div className="agent-group-header">
                <span
                  className="agent-avatar"
                  style={{ backgroundColor: getAgentColor(agentId) }}
                >
                  {getAgentName(agentId).charAt(0)}
                </span>
                <span className="agent-name">{getAgentName(agentId)}</span>
                <span className="message-count">{msgs.length} 条消息</span>
              </div>
              <div className="agent-messages">
                {msgs.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    agentName={getAgentName(msg.from)}
                    isOwn={msg.from === currentAgentId}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // 时间线顺序显示
          filteredMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              agentName={getAgentName(msg.from)}
              isOwn={msg.from === currentAgentId}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default MessageTimeline
