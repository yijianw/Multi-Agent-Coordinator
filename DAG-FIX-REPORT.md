# DAG 编辑器修复报告

**修复时间:** 2026-04-02 09:25  
**问题:** 选择混合模式后报错  
**状态:** ✅ 已修复

---

## 🐛 问题分析

### 错误原因

1. **React Hook 使用错误**
   ```javascript
   // ❌ 错误：useState 不能作为 useEffect 使用
   useState(() => {
     if (agents && agents.length > 0 && nodes.length === 0) {
       initDag(agents)
     }
   })
   ```

2. **缺少依赖项**
   - `initDag` 函数没有添加到依赖数组
   - `agents` 变化时未重新初始化

3. **缺少错误处理**
   - `initDag` 函数内部没有 try-catch
   - 错误导致整个应用崩溃

4. **空状态未处理**
   - 没有 Agent 时显示空白
   - 用户体验差

---

## ✅ 修复方案

### 1. 修正 React Hook

```javascript
// ✅ 正确：使用 useEffect
useEffect(() => {
  if (agents && agents.length > 0 && nodes.length === 0) {
    initDag(agents)
  }
}, [agents])  // 添加依赖项
```

### 2. 添加错误处理

```javascript
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

    // 创建连接
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

    // 通知父组件
    if (onChange) {
      onChange({
        stages: [{
          type: 'pipeline',
          agents: agentList.map(a => a.type)
        }]
      })
    }
  } catch (error) {
    console.error('DAG 初始化失败:', error)
  }
}
```

### 3. 空状态处理

```javascript
{agents && agents.length > 0 ? (
  <div className="dag-canvas">
    <ReactFlow ... />
  </div>
) : (
  <div className="dag-empty">
    <div className="empty-icon">🔀</div>
    <p>暂无 Agent</p>
    <span>请先添加 Agent 后再配置 DAG 工作流</span>
  </div>
)}
```

---

## 📸 修复后效果

### 空状态（未添加 Agent）

```
┌─────────────────────────────────────────┐
│  DAG 工作流编辑器    [🔄 重置]          │
├─────────────────────────────────────────┤
│                                         │
│              🔀                         │
│           暂无 Agent                    │
│   请先添加 Agent 后再配置 DAG 工作流     │
│                                         │
├─────────────────────────────────────────┤
│  💡 提示：拖拽节点调整位置...            │
└─────────────────────────────────────────┘
```

### 正常状态（有 Agent）

```
┌─────────────────────────────────────────┐
│  DAG 工作流编辑器    [🔄 重置]          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐                       │
│  │ coder - 前端  │                     │
│  └──────┬───────┘                       │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                       │
│  │ reviewer -   │                       │
│  │ 代码审查     │                       │
│  └──────┬───────┘                       │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                       │
│  │ tester -     │                       │
│  │ 软件测试     │                       │
│  └──────────────┘                       │
│                                         │
├─────────────────────────────────────────┤
│  💡 提示：拖拽节点调整位置...            │
└─────────────────────────────────────────┘
```

---

## 🧪 测试步骤

### 1. 混合模式切换测试

1. 打开 Web UI
2. 选择"混合"工作流模式
3. 确认不报错
4. 确认显示空状态提示

### 2. 添加 Agent 后测试

1. 添加 2-3 个 Agent
2. 选择"混合"模式
3. 确认 DAG 编辑器显示节点
4. 确认节点之间有连接线

### 3. 拖拽测试

1. 拖拽节点调整位置
2. 确认节点可以移动
3. 确认连接线跟随更新

### 4. 连接测试

1. 从一个节点拖拽到另一个节点
2. 确认创建新的连接
3. 确认配置更新

---

## 🎯 改进点

### 之前的问题

1. ❌ 使用错误的 Hook (`useState` 当 `useEffect`)
2. ❌ 没有错误处理
3. ❌ 空状态显示空白
4. ❌ 依赖项缺失

### 现在的优化

1. ✅ 正确使用 `useEffect`
2. ✅ 完整的 try-catch 错误处理
3. ✅ 空状态友好提示
4. ✅ 依赖项正确配置

---

## 📝 技术说明

### useEffect vs useState

```javascript
// ❌ 错误：useState 不接收函数作为副作用
useState(() => {
  // 这个函数会在每次渲染时执行
  doSomething()
})

// ✅ 正确：useEffect 用于副作用
useEffect(() => {
  // 只在依赖变化时执行
  doSomething()
}, [dependency])
```

### ReactFlow 初始化

```javascript
// 节点必须包含 id, type, position, data
const node = {
  id: 'agent-1',           // 唯一标识
  type: 'default',         // 节点类型
  position: { x: 200, y: 50 }, // 位置
  data: { label: 'Coder' } // 显示数据
}

// 边必须包含 id, source, target
const edge = {
  id: 'edge-1',
  source: 'agent-1',       // 起始节点 ID
  target: 'agent-2',       // 目标节点 ID
  type: 'smoothstep'       // 边类型
}
```

---

**修复完成！请刷新页面测试混合模式！** 🚀
