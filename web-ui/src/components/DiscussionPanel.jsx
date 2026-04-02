import { useState, useEffect } from 'react'
import MessageTimeline from './MessageTimeline'
import './DiscussionPanel.css'

function DiscussionPanel({ sessionId, agents, messageBus }) {
  const [messages, setMessages] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState('text')
  const [stats, setStats] = useState(null)

  // 模拟从消息总线获取消息 (实际应该通过 API)
  useEffect(() => {
    if (!messageBus) {
      // 模拟数据用于测试
      const mockMessages = [
        {
          id: 'msg-1',
          from: agents[0]?.id,
          to: agents[1]?.id,
          type: 'question',
          content: '有人可以帮我审查一下认证模块的代码吗？',
          timestamp: Date.now() - 300000,
          read: false
        },
        {
          id: 'msg-2',
          from: agents[1]?.id,
          to: agents[0]?.id,
          type: 'answer',
          content: '我可以帮忙！请把代码链接发给我。',
          timestamp: Date.now() - 240000,
          read: true,
          inReplyTo: 'msg-1',
          metadata: { confidence: 0.95 }
        },
        {
          id: 'msg-3',
          from: agents[2]?.id,
          to: null,
          type: 'suggestion',
          content: '建议使用 JWT tokens 进行认证，记得实现 refresh token 轮换机制。',
          timestamp: Date.now() - 180000,
          read: false
        }
      ]
      setMessages(mockMessages)
      return
    }

    // 实际从消息总线获取
    const fetchMessages = () => {
      const allMessages = messageBus.getHistory({ limit: 100 })
      setMessages(allMessages)
      setStats(messageBus.getStats())
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)

    return () => clearInterval(interval)
  }, [messageBus, agents])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedAgent) return

    const message = {
      from: 'current-user', // 实际应该是当前用户的 Agent ID
      to: selectedAgent,
      type: messageType,
      content: newMessage,
      timestamp: Date.now()
    }

    if (messageBus) {
      messageBus.sendMessage(message)
    } else {
      setMessages([...messages, message])
    }

    setNewMessage('')
  }

  const getUnreadCount = () => {
    return messages.filter(m => !m.read && m.to !== null).length
  }

  return (
    <div className="discussion-panel">
      <div className="panel-header">
        <h3>💬 讨论区</h3>
        {stats && (
          <div className="panel-stats">
            <span>📊 {stats.totalMessages} 条消息</span>
            <span>👥 {stats.totalAgents} 个 Agent</span>
            {getUnreadCount() > 0 && (
              <span className="unread-badge">{getUnreadCount()} 未读</span>
            )}
          </div>
        )}
      </div>

      <div className="panel-body">
        <MessageTimeline
          messages={messages}
          agents={agents}
          currentAgentId={null}
        />
      </div>

      <div className="panel-footer">
        <div className="message-input-row">
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="agent-select"
          >
            <option value="">选择接收者...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.icon} {agent.name}
              </option>
            ))}
          </select>

          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="type-select"
          >
            <option value="text">💬 消息</option>
            <option value="question">❓ 提问</option>
            <option value="answer">💡 回答</option>
            <option value="request">🙏 请求</option>
            <option value="suggestion">💭 建议</option>
            <option value="feedback">📝 反馈</option>
          </select>
        </div>

        <div className="message-input-row">
          <input
            type="text"
            className="message-input"
            placeholder="输入消息内容..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            className="btn-send"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !selectedAgent}
          >
            🚀 发送
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiscussionPanel
