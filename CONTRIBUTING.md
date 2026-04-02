# 🤝 贡献指南

感谢你对 Multi-Agent Coordinator 的兴趣！我们欢迎所有形式的贡献。

---

## 如何贡献

### 1. 报告 Bug

发现 Bug？请创建 Issue 并包含:
- 问题描述
- 复现步骤
- 预期行为 vs 实际行为
- 环境信息 (Node.js 版本、操作系统等)

### 2. 提出新功能

有新想法？请创建 Issue 并包含:
- 功能描述
- 使用场景
- 实现思路 (可选)

### 3. 提交代码

#### 简单修复

1. Fork 仓库
2. 创建分支 (`git checkout -b fix/typo`)
3. 提交更改
4. 推送并创建 Pull Request

#### 新功能

1. 先创建 Issue 讨论
2. 获得认可后 Fork 仓库
3. 创建分支 (`git checkout -b feature/new-feature`)
4. 实现功能 + 编写测试
5. 提交并创建 Pull Request

---

## 开发环境设置

### 1. Fork 并克隆

```bash
git clone https://github.com/YOUR_USERNAME/Multi-Agent-Coordinator.git
cd Multi-Agent-Coordinator
```

### 2. 安装依赖

```bash
# 主项目
npm install

# Web UI
cd web-ui && npm install && cd ..
```

### 3. 启动开发环境

```bash
# 终端 1: 独立服务器
node bin/multi-agent-server.js

# 终端 2: Web UI (开发模式)
cd web-ui && npm run dev
```

### 4. 运行测试

```bash
# 所有测试
npm test
```

---

## 提交指南

### Git Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <description>
```

#### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程

#### 示例

```bash
git commit -m "feat(ui): 添加 Agent 状态动画组件"
git commit -m "fix(server): 修复 sessionKey 传递问题"
git commit -m "docs(readme): 更新快速开始指南"
```

---

## 代码规范

### JavaScript/React

- 使用 ESLint + Prettier
- 使用 ES6+ 语法
- 使用函数组件 + Hooks
- 组件文件使用 `.jsx` 扩展名

### 命名规范

```javascript
// 文件命名
AgentConfig.jsx      // React 组件
agentFactory.js      // 工具模块

// 变量命名
const agentTypes = []      // 数组
const isRunning = false    // 布尔值
const handleStart = () => {} // 函数
```

---

## 测试要求

- 新功能必须包含单元测试
- 所有测试必须通过
- 使用描述性的测试名称

```javascript
// ✅ 好的测试名称
console.log('Test 1: Agent Factory - Create Agent')

// ❌ 避免
console.log('Test 1')
```

---

## Pull Request 流程

1. **创建 PR** - 清晰的标题和描述
2. **代码审查** - 至少需要 1 个维护者批准
3. **解决评论** - 回复所有评论
4. **合并** - Squash and Merge

---

## 常见问题

**Q: 如何开始贡献？**

A: 从简单的 Issue 开始，比如文档修复、小 Bug 修复。

**Q: 我的 PR 多久会被审查？**

A: 通常在 1-3 个工作日内。

**Q: 如何测试我的更改？**

A: 运行 `npm test` 并确保所有测试通过。

---

**感谢你的贡献！** 🎉
