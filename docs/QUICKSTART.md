# 🚀 快速开始指南

## 5 分钟上手 Multi-Agent Coordinator

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/multi-agent-coordinator.git
cd multi-agent-coordinator
```

### 步骤 2: 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装 Web UI 依赖
cd web-ui
npm install
cd ..
```

### 步骤 3: 启动服务

**终端 1 - 启动独立服务器:**

```bash
node bin/multi-agent-server.js
```

你会看到:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Multi-Agent Coordinator Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API: http://localhost:3458/api/health
✅ Independent server ready!
```

**终端 2 - 启动 Web UI:**

```bash
cd web-ui
npm run dev
```

你会看到:
```
VITE v8.0.3  ready in 200 ms

➜  Local:   http://localhost:5173/
```

### 步骤 4: 访问应用

打开浏览器访问：**http://localhost:5173/**

### 步骤 5: 创建你的第一个多 Agent 任务

1. **配置 Agent** (默认已有 1 个 Coder)
   - 点击 "+ 添加" 可以添加更多 Agent
   - 选择 Agent 类型（Coder/Reviewer/Tester 等）
   - 填写职责描述（可选）

2. **选择工作流模式**
   - 流水线：按顺序执行
   - 并行：同时执行
   - 讨论：互相协作
   - 混合：自定义流程

3. **输入任务描述**
   ```
   开发一个贪吃蛇游戏
   ```

4. **点击 "🚀 启动会话"**

5. **观察执行**
   - 右侧实时监控显示每个 Agent 的状态
   - 进度条显示执行进度
   - 日志流显示详细信息

### 示例任务

#### 示例 1: 开发 Web 应用

**Agent 配置:**
- 👨‍💻 Coder: "开发前端界面"
- 🔍 Reviewer: "审查代码质量"
- 🧪 Tester: "编写测试用例"

**任务描述:**
```
创建一个待办事项管理 Web 应用，包含添加、删除、标记完成功能
```

**工作流:** 并行

#### 示例 2: 代码重构

**Agent 配置:**
- 📚 Researcher: "分析现有代码结构"
- 👨‍💻 Coder: "重构代码"
- 🔍 Reviewer: "审查重构结果"

**任务描述:**
```
重构用户认证模块，提高代码可维护性和性能
```

**工作流:** 流水线

#### 示例 3: 复杂问题求解

**Agent 配置:**
- 👨‍💻 Coder A: "实现方案 A"
- 👨‍💻 Coder B: "实现方案 B"
- 🔍 Reviewer: "对比评估两个方案"

**任务描述:**
```
设计并实现一个高效的缓存系统，考虑内存管理和性能优化
```

**工作流:** 讨论

---

## 📚 下一步

- [架构设计](./ARCHITECTURE.md) - 了解系统架构
- [API 文档](./API.md) - API 使用指南
- [开发指南](./DEVELOPMENT.md) - 如何贡献代码
- [常见问题](./FAQ.md) - 问题解答

---

## 💡 提示

- **强制刷新**: 如果页面不更新，按 `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)
- **查看日志**: 按 `F12` 打开浏览器控制台查看详细日志
- **停止服务**: 在终端按 `Ctrl+C` 停止服务
- **清理缓存**: 如果遇到问题，运行 `npm run clean` 然后重新安装

---

**祝你使用愉快！** 🎉
