import { useState, useMemo } from 'react'
import './GanttChart.css'

function GanttChart({ agents, tasks, sessionStart, sessionEnd }) {
  const [zoom, setZoom] = useState(1) // 缩放级别 0.5-2

  // 计算时间范围
  const timeRange = useMemo(() => {
    const start = sessionStart || Date.now() - 3600000 // 默认 1 小时前
    const end = sessionEnd || Date.now()
    const duration = end - start
    
    return { start, end, duration }
  }, [sessionStart, sessionEnd])

  // 生成时间刻度
  const timeLabels = useMemo(() => {
    const labels = []
    const interval = timeRange.duration / 10 // 10 个刻度
    
    for (let i = 0; i <= 10; i++) {
      const timestamp = timeRange.start + (interval * i)
      const date = new Date(timestamp)
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()
      labels.push(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    return labels
  }, [timeRange])

  // 计算任务条位置
  const calculateTaskPosition = (task) => {
    const { start, duration } = timeRange
    
    const taskStart = task.startTime || start
    const taskDuration = task.duration || 0
    const taskEnd = taskStart + taskDuration
    
    const left = ((taskStart - start) / duration) * 100
    const width = ((taskEnd - taskStart) / duration) * 100
    
    return {
      left: Math.max(0, Math.min(100, left)),
      width: Math.max(0.5, Math.min(100 - left, width))
    }
  }

  // 获取任务状态颜色
  const getStatusColor = (status) => {
    const colors = {
      pending: '#9ca3af',    // 灰色
      running: '#10b981',    // 绿色
      paused: '#f59e0b',     // 橙色
      completed: '#3b82f6',  // 蓝色
      failed: '#ef4444'      // 红色
    }
    return colors[status] || colors.pending
  }

  // 获取任务优先级样式
  const getPriorityStyle = (priority) => {
    const styles = {
      low: { opacity: 0.6 },
      normal: {},
      high: { borderWidth: '3px' },
      urgent: { borderWidth: '4px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)' }
    }
    return styles[priority] || styles.normal
  }

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        <h3>📊 进度甘特图</h3>
        <div className="gantt-controls">
          <label>缩放:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="gantt-body">
        {/* 时间刻度 */}
        <div className="time-scale">
          {timeLabels.map((label, index) => (
            <div key={index} className="time-label">
              {label}
            </div>
          ))}
          {/* 网格线 */}
          <div className="grid-lines">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="grid-line" />
            ))}
          </div>
        </div>

        {/* Agent 任务条 */}
        <div className="agent-tasks" style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}>
          {agents.map((agent, agentIndex) => (
            <div key={agent.id} className="agent-row">
              <div className="agent-label">
                <span className="agent-icon">{agent.icon}</span>
                <span className="agent-name">{agent.name}</span>
              </div>
              <div className="task-track">
                {agent.tasks && agent.tasks.map((task, taskIndex) => {
                  const pos = calculateTaskPosition(task)
                  const bgColor = getStatusColor(task.status || 'pending')
                  const priorityStyle = getPriorityStyle(task.priority || 'normal')
                  
                  return (
                    <div
                      key={task.id || taskIndex}
                      className="task-bar"
                      style={{
                        left: `${pos.left}%`,
                        width: `${pos.width}%`,
                        backgroundColor: bgColor,
                        ...priorityStyle
                      }}
                      title={`${task.name || '任务'}\n状态：${task.status}\n优先级：${task.priority}`}
                    >
                      <span className="task-name">{task.name || '任务'}</span>
                      {task.progress !== undefined && (
                        <span className="task-progress">{task.progress}%</span>
                      )}
                    </div>
                  )
                })}
                
                {/* 当前时间线 */}
                <div
                  className="current-time-line"
                  style={{
                    left: `${((Date.now() - timeRange.start) / timeRange.duration) * 100}%`
                  }}
                >
                  <span className="time-label-now">现在</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="gantt-legend">
        <div className="legend-item">
          <span className="legend-color pending"></span>
          <span>等待中</span>
        </div>
        <div className="legend-item">
          <span className="legend-color running"></span>
          <span>运行中</span>
        </div>
        <div className="legend-item">
          <span className="legend-color paused"></span>
          <span>已暂停</span>
        </div>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          <span>已完成</span>
        </div>
        <div className="legend-item">
          <span className="legend-color failed"></span>
          <span>失败</span>
        </div>
      </div>
    </div>
  )
}

export default GanttChart
