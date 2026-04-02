# 🚀 快速开始指南

## 5 分钟上手 Multi-Agent Coordinator

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/yijianw/Multi-Agent-Coordinator.git
cd Multi-Agent-Coordinator
```

### 步骤 2: 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装 Web UI 依赖
cd web-ui && npm install && cd ..
```

### 步骤 3: 启动服务

**终端 1 - 启动独立服务器:**

```bash
node bin/multi-agent-server.js
```

**终端 2 - 启动 Web UI:**

```bash
cd web-ui && npm run dev
```

### 步骤 4: 访问应用

打开浏览器访问：**http://localhost:5173/**

### 步骤 5: 创建第一个任务

1. **配置 Agent** - 点击 "+ 添加" 添加更多 Agent
2. **选择工作流模式** - 流水线/并行/讨论/混合
3. **输入任务描述** - 例如 "开发一个贪吃蛇游戏"
4. **点击 "🚀 启动会话"**
5. **观察执行** - 右侧实时监控显示状态

---

## 示例任务

### 示例 1: 开发 Web 应用

**Agent 配置:**
- 👨‍💻 Coder: "开发前端界面"
- 🔍 Reviewer: "审查代码质量"
- 🧪 Tester: "编写测试用例"

**任务:** 创建一个待办事项管理 Web 应用

**工作流:** 并行

### 示例 2: 代码重构

**Agent 配置:**
- 📚 Researcher: "分析现有代码结构"
- 👨‍💻 Coder: "重构代码"
- 🔍 Reviewer: "审查重构结果"

**任务:** 重构用户认证模块

**工作流:** 流水线

---

## 💡 提示

- **强制刷新**: 按 `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)
- **查看日志**: 按 `F12` 打开浏览器控制台
- **停止服务**: 在终端按 `Ctrl+C`

---

**祝你使用愉快！** 🎉
