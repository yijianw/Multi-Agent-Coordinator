import './MessageBubble.css'

const MessageTypeIcons = {
  text: '💬',
  question: '❓',
  answer: '💡',
  request: '🙏',
  suggestion: '💭',
  feedback: '📝',
  system: '⚙️'
}

const MessageTypeColors = {
  text: '#4a90d9',
  question: '#f59e0b',
  answer: '#10b981',
  request: '#ec4899',
  suggestion: '#8b5cf6',
  feedback: '#6b7280',
  system: '#374151'
}

function MessageBubble({ message, agentName, isOwn, showReplies = true }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeLabel = (type) => {
    const labels = {
      text: '消息',
      question: '提问',
      answer: '回答',
      request: '请求',
      suggestion: '建议',
      feedback: '反馈',
      system: '系统'
    }
    return labels[type] || type
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : ''} ${message.type}`}>
      <div className="bubble-header">
        <span className="bubble-icon">{MessageTypeIcons[message.type] || '💬'}</span>
        <span className="bubble-sender">{agentName || message.from}</span>
        <span className="bubble-type" style={{ color: MessageTypeColors[message.type] }}>
          {getTypeLabel(message.type)}
        </span>
        <span className="bubble-time">{formatTime(message.timestamp)}</span>
      </div>

      <div className="bubble-content">
        {message.content}
      </div>

      {message.inReplyTo && showReplies && (
        <div className="bubble-reply-indicator">
          ↩️ 回复消息 #{message.inReplyTo.substr(-6)}
        </div>
      )}

      {message.metadata && message.metadata.confidence && (
        <div className="bubble-confidence">
          置信度：{Math.round(message.metadata.confidence * 100)}%
        </div>
      )}

      {!message.read && !isOwn && (
        <div className="bubble-unread-badge">新</div>
      )}
    </div>
  )
}

export default MessageBubble
