import { useState, useEffect } from 'react'
import './App.css'
import AgentConfig from './components/AgentConfig'
import WorkflowSelector from './components/WorkflowSelector'
import MonitorPanel from './components/MonitorPanel'
import DagEditor from './components/DagEditor'
import ResultView from './components/ResultView'
import SessionHistory from './components/SessionHistory'
import ConfigManager from './components/ConfigManager'

// API 配置：调用独立服务器
const API_BASE = 'http://localhost:3458/api'  // 独立服务器端口

function App() {
  const [agents, setAgents] = useState([
    { id: 1, type: 'coder', role: '', enhancedPrompt: '' }
  ])
  const [workflowMode, setWorkflowMode] = useState('parallel')
  const [taskDescription, setTaskDescription] = useState('')
  const [dagConfig, setDagConfig] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [agentTypes, setAgentTypes] = useState([])
  const [workflowModes, setWorkflowModes] = useState([])
  const [pollInterval, setPollInterval] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const wasRunningRef = useState(false)

  // 轮询会话状态 (替代 WebSocket)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/session/status`)
        if (!res.ok) {
          console.error('Status API error:', res.status)
          return
        }
        
        const data = await res.json()
        
        if (data && !data.error) {
          setSessionStatus(data)
          
          // 如果有新日志，追加
          if (data.logs && Array.isArray(data.logs)) {
            setLogs(prev => {
              const newLogs = data.logs.filter(l => 
                !prev.some(p => p.timestamp === l.timestamp)
              )
              if (newLogs.length > 0) {
                return [...prev, ...newLogs].slice(-100)
              }
              return prev
            })
          }
          
          // 检查是否完成
          if (!data.isRunning && wasRunningRef[0]) {
            setIsRunning(false)
            fetchResults()
          }
          wasRunningRef[1](data.isRunning)
        } else if (data && data.error) {
          // 静默处理错误（会话未开始等正常情况）
          if (data.error !== 'No active session') {
            console.log('Status:', data.error)
          }
        }
      } catch (error) {
        // 网络错误等，静默处理
        console.debug('Polling error:', error.message)
      }
    }

    if (isRunning) {
      const intervalId = setInterval(poll, 1000) // 改为 1 秒轮询一次
      setPollInterval(intervalId)
    } else {
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isRunning])

  // 加载 Agent 类型和工作流模式 (使用默认数据，独立服务器没有这些 API)
  useEffect(() => {
    setAgentTypes([
      { key: 'coder', name: 'Coder', icon: '👨‍💻', description: '编写高质量代码' },
      { key: 'reviewer', name: 'Reviewer', icon: '🔍', description: '代码审查' },
      { key: 'tester', name: 'Tester', icon: '🧪', description: '软件测试' },
      { key: 'researcher', name: 'Researcher', icon: '📚', description: '信息研究' },
      { key: 'doc_writer', name: 'Doc Writer', icon: '📝', description: '文档撰写' },
      { key: 'others', name: 'Custom', icon: '🔧', description: '自定义角色' }
    ])
    setWorkflowModes([
      { key: 'pipeline', name: '流水线', description: 'Agent 按顺序依次执行', icon: '➡️' },
      { key: 'parallel', name: '并行', description: '所有 Agent 同时执行', icon: '∥' },
      { key: 'discussion', name: '讨论', description: 'Agent 互相交流', icon: '💬' },
      { key: 'hybrid', name: '混合', description: '复杂 DAG 工作流', icon: '🔀' }
    ])
  }, [])

  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/report`)
      const data = await res.json()
      if (data && !data.error) {
        setResults(data)
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const addAgent = () => {
    const newId = Math.max(...agents.map(a => a.id), 0) + 1
    setAgents([...agents, { id: newId, type: 'coder', role: '', enhancedPrompt: '' }])
  }

  const removeAgent = (id) => {
    if (agents.length > 1) {
      setAgents(agents.filter(a => a.id !== id))
    }
  }

  const updateAgent = (id, field, value) => {
    setAgents(agents.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ))
    // 显示保存提示
    setSaveStatus('已保存')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const startSession = async () => {
    if (!taskDescription.trim()) {
      alert('请输入任务描述')
      return
    }

    setIsRunning(true)
    setLogs([])
    setResults(null)

    try {
      // 为每个 Agent 创建 spawn 任务
      const spawnPromises = agents.map(async (agent) => {
        const res = await fetch(`${API_BASE}/spawn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: `${agent.role || agent.type}: ${taskDescription}`,
            agentId: agent.type,
            model: 'bailian/qwen3.5-plus',
            runTimeoutSeconds: 3600
          })
        })
        
        return await res.json()
      })
      
      const results = await Promise.all(spawnPromises)
      console.log('Agents spawned:', results)
      
      // 开始轮询状态
      startPolling(results.map(r => r.sessionKey))
      
    } catch (error) {
      console.error('Failed to start session:', error)
      alert(`Error: ${error.message}`)
      setIsRunning(false)
    }
  }

  const startPolling = (sessionKeys) => {
    const poll = async () => {
      try {
        const statusPromises = sessionKeys.map(async (key) => {
          const res = await fetch(`${API_BASE}/status?sessionKey=${key}`)
          return await res.json()
        })
        
        const statuses = await Promise.all(statusPromises)
        console.log('Polling status:', statuses)
        
        // 更新状态
        const allCompleted = statuses.every(s => s.status === 'completed' || s.status === 'failed')
        
        setSessionStatus({
          agents: statuses,
          isRunning: !allCompleted,
          summary: {
            total: statuses.length,
            completed: statuses.filter(s => s.status === 'completed').length,
            running: statuses.filter(s => s.status === 'running').length
          }
        })
        
        if (allCompleted) {
          setIsRunning(false)
          if (pollInterval) {
            clearInterval(pollInterval)
            setPollInterval(null)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
    
    // 开始轮询
    const intervalId = setInterval(poll, 2000)
    setPollInterval(intervalId)
    
    // 立即执行一次
    poll()
  }

  const stopSession = async () => {
    try {
      await fetch(`${API_BASE}/session/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionStatus?.sessionId })
      })
    } catch (error) {
      console.error('Failed to stop session:', error)
    }
    setIsRunning(false)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📜 Multi-Agent Coordinator</h1>
        <div className="header-actions">
          {!isRunning ? (
            <button className="btn btn-primary" onClick={startSession}>
              🚀 启动会话
            </button>
          ) : (
            <button className="btn btn-danger" onClick={stopSession}>
              ⏹️ 停止
            </button>
          )}
        </div>
      </header>

      <div className="main-content">
        <div className="left-panel">
          {/* 工作流模式选择 */}
          <section className="card">
            <h2>工作流模式</h2>
            <WorkflowSelector
              modes={workflowModes}
              selected={workflowMode}
              onChange={setWorkflowMode}
            />
          </section>

          {/* Agent 配置 */}
          <section className="card">
            <div className="card-header">
              <h2>Agent 配置</h2>
              <div className="header-actions-group">
                {saveStatus && <span className="save-status">✅ {saveStatus}</span>}
                <button className="btn btn-sm" onClick={addAgent}>+ 添加</button>
              </div>
            </div>
            <div className="agent-list">
              {agents.map(agent => (
                <AgentConfig
                  key={agent.id}
                  agent={agent}
                  types={agentTypes}
                  onUpdate={(field, value) => updateAgent(agent.id, field, value)}
                  onRemove={() => removeAgent(agent.id)}
                  canRemove={agents.length > 1}
                />
              ))}
            </div>
          </section>

          {/* 任务描述 */}
          <section className="card">
            <h2>任务描述</h2>
            <textarea
              className="task-input"
              placeholder="描述你想要完成的任务..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              disabled={isRunning}
            />
          </section>

          {/* 配置管理 */}
          <section className="card">
            <ConfigManager
              currentConfig={{ agents, mode: workflowMode, dag: dagConfig }}
              onSaveConfig={(name) => console.log('Config saved:', name)}
              onLoadConfig={(config, name) => {
                if (config.agents) setAgents(config.agents)
                if (config.mode) setWorkflowMode(config.mode)
                if (config.dag) setDagConfig(config.dag)
              }}
            />
          </section>

          {/* DAG 编辑器（仅混合模式显示） */}
          {workflowMode === 'hybrid' && (
            <section className="card">
              <h2>DAG 工作流编辑器</h2>
              <DagEditor
                agents={agents}
                config={dagConfig}
                onChange={setDagConfig}
              />
            </section>
          )}

          {/* 历史记录 */}
          <section className="card">
            <SessionHistory
              onSelectSession={(session) => {
                console.log('Selected session:', session)
                // 可以加载历史会话的配置
              }}
              onClearHistory={() => console.log('History cleared')}
            />
          </section>
        </div>

        <div className="right-panel">
          {/* 实时监控 */}
          <section className="card">
            <h2>实时监控</h2>
            <MonitorPanel status={sessionStatus} logs={logs} isRunning={isRunning} />
          </section>

          {/* 结果展示 */}
          {results && (
            <section className="card">
              <h2>执行结果</h2>
              <ResultView report={results} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
