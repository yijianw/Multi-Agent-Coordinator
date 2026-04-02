import { useState } from 'react'
import './ConfigManager.css'

function ConfigManager({ currentConfig, onLoadConfig, onSaveConfig }) {
  const [configs, setConfigs] = useState({})
  const [configName, setConfigName] = useState('')
  const [showLoad, setShowLoad] = useState(false)

  const loadConfigs = () => {
    try {
      const data = localStorage.getItem('mac_configs')
      const loaded = data ? JSON.parse(data) : {}
      setConfigs(loaded)
    } catch (error) {
      console.error('Failed to load configs:', error)
    }
  }

  const handleSave = () => {
    if (!configName.trim()) {
      alert('请输入配置名称')
      return
    }

    try {
      const updated = { ...configs, [configName]: { ...currentConfig, savedAt: Date.now() } }
      localStorage.setItem('mac_configs', JSON.stringify(updated))
      setConfigs(updated)
      setConfigName('')
      
      if (onSaveConfig) {
        onSaveConfig(configName)
      }
      
      alert(`配置 "${configName}" 已保存！`)
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('保存失败')
    }
  }

  const handleLoad = (name) => {
    const config = configs[name]
    if (config && onLoadConfig) {
      onLoadConfig(config, name)
      setShowLoad(false)
    }
  }

  const handleDelete = (name, e) => {
    e.stopPropagation()
    if (confirm(`确定要删除配置 "${name}" 吗？`)) {
      try {
        const { [name]: removed, ...rest } = configs
        localStorage.setItem('mac_configs', JSON.stringify(rest))
        setConfigs(rest)
      } catch (error) {
        console.error('Failed to delete config:', error)
      }
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <div className="config-manager">
      <div className="config-header">
        <h3>⚙️ 配置管理</h3>
        <button
          className="btn btn-sm"
          onClick={() => {
            loadConfigs()
            setShowLoad(!showLoad)
          }}
        >
          {showLoad ? '❌ 取消' : '📂 加载'}
        </button>
      </div>

      {/* 保存配置 */}
      <div className="config-save">
        <input
          type="text"
          className="config-name-input"
          placeholder="配置名称 (如：日常开发、代码审查)..."
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          💾 保存当前配置
        </button>
      </div>

      {/* 加载配置列表 */}
      {showLoad && (
        <div className="config-list">
          {Object.keys(configs).length === 0 ? (
            <div className="config-empty">暂无保存的配置</div>
          ) : (
            Object.entries(configs).map(([name, config]) => (
              <div
                key={name}
                className="config-item"
                onClick={() => handleLoad(name)}
              >
                <div className="config-item-header">
                  <span className="config-name">{name}</span>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => handleDelete(name, e)}
                  >
                    ✕
                  </button>
                </div>
                <div className="config-item-meta">
                  <span>📅 {formatTime(config.savedAt)}</span>
                  <span>🔧 {config.agents?.length || 0} Agents</span>
                  <span>🎯 {config.mode}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ConfigManager
