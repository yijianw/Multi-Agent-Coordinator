import './AgentConfig.css'

function AgentConfig({ agent, types, onUpdate, onRemove, canRemove }) {
  // 如果 types 为空，使用默认数据
  const defaultTypes = [
    { key: 'coder', name: 'Coder', icon: '👨‍💻', description: '编写高质量代码' },
    { key: 'reviewer', name: 'Reviewer', icon: '🔍', description: '代码审查' },
    { key: 'tester', name: 'Tester', icon: '🧪', description: '软件测试' },
    { key: 'researcher', name: 'Researcher', icon: '📚', description: '信息研究' },
    { key: 'doc_writer', name: 'Doc Writer', icon: '📝', description: '文档撰写' },
    { key: 'others', name: 'Custom', icon: '🔧', description: '自定义角色' }
  ]
  
  const displayTypes = types && types.length > 0 ? types : defaultTypes
  const selectedType = displayTypes.find(t => t.key === agent.type)

  return (
    <div className="agent-config">
      <div className="agent-header">
        <div className="agent-type-selector">
          <label>类型:</label>
          <select
            value={agent.type}
            onChange={(e) => onUpdate('type', e.target.value)}
          >
            {displayTypes.map(type => (
              <option key={type.key} value={type.key}>
                {type.icon} {type.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-sm btn-remove"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? '移除 Agent' : '至少保留一个 Agent'}
        >
          ✕
        </button>
      </div>

      <div className="agent-role">
        <label>角色/职责:</label>
        <input
          type="text"
          placeholder="例如：前端开发、后端 API、数据库优化..."
          value={agent.role}
          onChange={(e) => onUpdate('role', e.target.value)}
        />
      </div>

      <div className="agent-enhancement">
        <label>
          <span className="icon">✨</span> 功能强化 (可选):
        </label>
        <textarea
          placeholder="添加特殊要求，例如：&#10;- 使用 TypeScript 严格模式&#10;- 优先使用函数式编程&#10;- 避免使用 any 类型"
          value={agent.enhancedPrompt}
          onChange={(e) => onUpdate('enhancedPrompt', e.target.value)}
          rows={3}
        />
      </div>

      {selectedType && (
        <div className="agent-description">
          <strong>预设能力:</strong>
          <p>{selectedType.description}</p>
        </div>
      )}
    </div>
  )
}

export default AgentConfig
