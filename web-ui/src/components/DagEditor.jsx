import { useEffect } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow'
import 'reactflow/dist/style.css'
import './DagEditor.css'

function DagEditor({ agents, config, onChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 初始化 DAG
  useEffect(() => {
    if (agents && agents.length > 0 && nodes.length === 0) {
      initDag(agents)
    }
  }, [agents])

  const initDag = (agentList) => {
    try {
      // 创建节点
      const newNodes = agentList.map((agent, index) => ({
        id: `agent-${agent.id}`,
        type: 'default',
        position: { x: 200, y: index * 100 + 50 },
        data: {
          label: `${agent.type} - ${agent.role || 'Agent'}`
        }
      }))

      // 创建默认流水线连接
      const newEdges = []
      for (let i = 0; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `edge-${i}`,
          source: newNodes[i].id,
          target: newNodes[i + 1].id,
          type: 'smoothstep'
        })
      }

      setNodes(newNodes)
      setEdges(newEdges)

      // 通知父组件配置变化
      if (onChange) {
        onChange({
          stages: [
            {
              type: 'pipeline',
              agents: agentList.map(a => a.type)
            }
          ]
        })
      }
    } catch (error) {
      console.error('DAG 初始化失败:', error)
    }
  }

  const onConnect = (params) => {
    const newEdge = { ...params, type: 'smoothstep' }
    setEdges((eds) => addEdge(newEdge, eds))
    updateConfig(edges, nodes)
  }

  const updateConfig = (currentEdges, currentNodes) => {
    // 简单的 DAG 配置生成（实际应该更复杂）
    const stages = []
    const nodeTypes = currentNodes.map(n => {
      const agentId = n.id.replace('agent-', '')
      const agent = agents.find(a => a.id == agentId)
      return agent?.type || 'unknown'
    })

    stages.push({
      type: 'pipeline',
      agents: nodeTypes
    })

    if (onChange) {
      onChange({ stages })
    }
  }

  const addStage = (type) => {
    // 添加新阶段逻辑
    console.log('Add stage:', type)
  }

  return (
    <div className="dag-editor">
      <div className="dag-toolbar">
        <button className="btn btn-sm" onClick={() => initDag(agents)}>
          🔄 重置
        </button>
        <button className="btn btn-sm" onClick={() => addStage('parallel')}>
          ➕ 添加并行阶段
        </button>
        <button className="btn btn-sm" onClick={() => addStage('pipeline')}>
          ➕ 添加流水阶段
        </button>
      </div>

      {agents && agents.length > 0 ? (
        <div className="dag-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      ) : (
        <div className="dag-empty">
          <div className="empty-icon">🔀</div>
          <p>暂无 Agent</p>
          <span>请先添加 Agent 后再配置 DAG 工作流</span>
        </div>
      )}

      <div className="dag-help">
        <p>💡 提示：拖拽节点调整位置，从节点拖拽连接线创建依赖关系</p>
      </div>
    </div>
  )
}

export default DagEditor
