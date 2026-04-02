# 🤝 贡献指南

感谢你对 Multi-Agent Coordinator 的兴趣！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交指南](#提交指南)
- [代码规范](#代码规范)

---

## 行为准则

- 尊重他人观点
- 建设性批评
- 包容多样性
- 专注技术讨论

---

## 如何贡献

### 1. 报告 Bug

发现 Bug？请创建 Issue 并包含:
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息 (Node.js 版本、操作系统等)
- 截图 (如果适用)

### 2. 提出新功能

有新想法？请创建 Issue 并包含:
- 功能描述
- 使用场景
- 实现思路 (可选)
- 潜在影响

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
git clone https://github.com/YOUR_USERNAME/multi-agent-coordinator.git
cd multi-agent-coordinator
```

### 2. 安装依赖

```bash
# 主项目
npm install

# Web UI
cd web-ui
npm install
cd ..
```

### 3. 启动开发环境

```bash
# 终端 1: 独立服务器
node bin/multi-agent-server.js

# 终端 2: Web UI (开发模式)
cd web-ui
npm run dev
```

### 4. 运行测试

```bash
# 所有测试
npm test

# 单独测试
node bin/test-api.js
node bin/test-integration.js
```

---

## 提交指南

### Git Commit 规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式 (不影响功能)
- `refactor`: 重构 (不是新功能也不是修复)
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

#### 示例

```bash
# 新功能
git commit -m "feat(ui): 添加 Agent 状态动画组件"

# Bug 修复
git commit -m "fix(server): 修复 sessionKey 传递问题"

# 文档更新
git commit -m "docs(readme): 更新快速开始指南"

# 重构
git commit -m "refactor(core): 优化 Orchestrator 执行逻辑"
```

### Pull Request 流程

1. **创建 PR**
   - 清晰的标题
   - 详细的描述
   - 关联 Issue (如果有)

2. **PR 模板**

```markdown
## 描述
简要描述这个 PR 做了什么

## 类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 重构
- [ ] 性能优化

## 测试
- [ ] 已添加测试
- [ ] 所有测试通过
- [ ] 已手动测试

## 截图
(如果适用)

## 相关问题
Fixes #123
```

3. **代码审查**
   - 至少需要 1 个维护者批准
   - 解决所有评论
   - 确保 CI 通过

4. **合并**
   - 使用 Squash and Merge
   - 删除源分支

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
multi-agent-server.js // 独立服务器

// 变量命名
const agentTypes = []      // 数组
const agentConfig = {}     // 对象
const isRunning = false    // 布尔值
const handleStart = () => {} // 函数

// 组件命名
function AgentConfig() {}  // PascalCase
```

### 代码风格

```javascript
// ✅ 好的风格
const fetchAgentStatus = async (sessionKey) => {
  try {
    const res = await fetch(`/api/status?sessionKey=${sessionKey}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch status:', error)
    throw error
  }
}

// ❌ 避免
function x(key) {  // 不清晰的命名
  let r = fetch('/api/status?sessionKey=' + key)  // 不使用 async/await
  return r  // 没有错误处理
}
```

### 注释规范

```javascript
/**
 * 生成 Agent 任务提示
 * @param {Object} agent - Agent 配置对象
 * @param {string} agent.type - Agent 类型
 * @param {string} agent.taskDescription - 任务描述
 * @returns {string} 格式化的任务提示
 */
function buildAgentTaskPrompt(agent) {
  // 构建任务提示逻辑
  return `...`
}
```

---

## 测试要求

### 单元测试

- 新功能必须包含单元测试
- 测试覆盖率 > 80%
- 使用描述性的测试名称

```javascript
// ✅ 好的测试名称
console.log('Test 1: Agent Factory - Create Agent')
console.log('Test 2: Status Polling - Update Progress')

// ❌ 避免
console.log('Test 1')
console.log('Test 2')
```

### 集成测试

- 测试 API 端点
- 测试完整流程
- 测试错误处理

---

## 文档要求

- 更新 README.md (如果影响用户)
- 更新 API 文档 (如果修改 API)
- 添加 JSDoc 注释 (公共函数)
- 更新 CHANGELOG.md (如果适用)

---

## 发布流程

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH` (例如：1.0.0)
- `MAJOR`: 不兼容的 API 更改
- `MINOR`: 向后兼容的功能
- `PATCH`: 向后兼容的 Bug 修复

### 发布步骤

1. 更新 `package.json` 版本号
2. 更新 `CHANGELOG.md`
3. 创建 Git tag: `git tag v1.0.0`
4. 推送 tag: `git push origin v1.0.0`
5. 在 GitHub 创建 Release

---

## 常见问题

### Q: 如何开始贡献？

A: 从简单的 Issue 开始，比如文档修复、小 Bug 修复。熟悉代码后再尝试复杂功能。

### Q: 我的 PR 多久会被审查？

A: 通常在 1-3 个工作日内。如果超过一周没有回复，可以 @ 维护者。

### Q: 可以同时处理多个 Issue 吗？

A: 可以，但建议先完成一个再开始下一个，保证质量。

### Q: 如何测试我的更改？

A: 运行 `npm test` 并确保所有测试通过。同时手动测试功能。

---

## 联系方式

- GitHub Issues: [提交 Issue](https://github.com/YOUR_USERNAME/multi-agent-coordinator/issues)
- Email: your-email@example.com

---

**感谢你的贡献！** 🎉
