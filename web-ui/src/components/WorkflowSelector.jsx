import './WorkflowSelector.css'

function WorkflowSelector({ modes, selected, onChange }) {
  // 如果 modes 为空，使用默认数据
  const defaultModes = [
    { key: 'pipeline', name: '流水线', description: 'Agent 按顺序依次执行，前一个完成后触发下一个', icon: '➡️' },
    { key: 'parallel', name: '并行', description: '所有 Agent 同时执行，最后汇总结果', icon: '∥' },
    { key: 'discussion', name: '讨论', description: 'Agent 可以互相交流，协同解决问题', icon: '💬' },
    { key: 'hybrid', name: '混合', description: '结合多种模式，支持复杂的 DAG 工作流', icon: '🔀' }
  ]
  
  const displayModes = modes && modes.length > 0 ? modes : defaultModes

  return (
    <div className="workflow-selector">
      <div className="mode-options">
        {displayModes.map(mode => (
          <label
            key={mode.key}
            className={`mode-option ${selected === mode.key ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="workflow-mode"
              value={mode.key}
              checked={selected === mode.key}
              onChange={(e) => onChange(e.target.value)}
            />
            <div className="mode-card">
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-name">{mode.name}</span>
              <span className="mode-desc">{mode.description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default WorkflowSelector
