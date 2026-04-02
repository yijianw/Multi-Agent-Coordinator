# 使用说明 - 重要！

## ⚠️ 访问方式说明

### ❌ 错误方式

**不要访问:** `http://localhost:3456/`

**原因:** 3456 端口是后端 API 服务，虽然能提供静态文件，但这不是主要用途。

---

### ✅ 正确方式

**开发模式 (推荐):**

1. **启动后端服务:**
   ```bash
   cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator"
   npm start
   ```
   
   输出应该显示:
   ```
   ✅ HTTP Server running on http://localhost:3456
   ```

2. **启动前端开发服务器:**
   ```bash
   cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator\web-ui"
   npm run dev
   ```
   
   输出应该显示:
   ```
   ➜  Local:   http://localhost:5173/
   ```

3. **访问浏览器:**
   ```
   http://localhost:5173/
   ```

---

### 🔄 为什么需要两个服务？

**后端服务 (3456 端口):**
- 提供 API 端点 (`/api/*`)
- 处理业务逻辑
- 管理 Agent 会话

**前端开发服务器 (5173 端口):**
- 提供 React 应用
- 热更新 (HMR)
- 代理 API 请求到后端

**Vite 配置:**
```javascript
// web-ui/vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3456',  // 代理到后端
        changeOrigin: true
      }
    }
  }
})
```

---

## 📝 完整启动流程

### 步骤 1: 启动后端

```bash
# 打开终端 1
cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator"
npm start
```

**验证输出:**
```
✨ Multi-Agent Coordinator is ready!

📡 API: http://localhost:3456/api/health
🌍 Web UI: http://localhost:3456/
📡 WebSocket: ws://localhost:3457/

Press Ctrl+C to stop
```

### 步骤 2: 启动前端

```bash
# 打开终端 2
cd "C:\Users\Yijian\.openclaw\workspace\skills\multi-agent-coordinator\web-ui"
npm run dev
```

**验证输出:**
```
VITE v8.0.3  ready in 200 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 步骤 3: 访问浏览器

打开浏览器访问:
```
http://localhost:5173/
```

**不要访问:**
```
http://localhost:3456/  ❌ 这是 API 服务
```

---

## 🧪 测试验证

### 1. 检查后端 API

```bash
curl http://localhost:3456/api/health
```

**预期:**
```json
{"status":"ok","timestamp":1775091234567}
```

### 2. 检查前端

浏览器访问 `http://localhost:5173/`

**预期:**
- ✅ 显示 Multi-Agent Coordinator 界面
- ✅ 左侧显示工作流模式选择
- ✅ 左侧显示 Agent 配置
- ✅ 右侧显示实时监控
- ✅ 无控制台错误

### 3. 测试启动会话

1. 配置 2-3 个 Agent
2. 选择工作流模式
3. 输入任务描述
4. 点击"🚀 启动会话"

**预期:**
- ✅ 无 JSON 解析错误
- ✅ 右侧显示 Agent 状态动画卡片
- ✅ 进度条正常更新
- ✅ 日志实时滚动

---

## 🐛 常见问题

### Q1: 访问 3456 端口显示空白

**A:** 3456 是 API 服务，不是用来直接访问的。请启动前端开发服务器并访问 5173 端口。

### Q2: 前端无法连接后端 API

**检查清单:**
- [ ] 后端服务是否运行 (`npm start`)
- [ ] 后端是否监听 3456 端口
- [ ] Vite proxy 配置是否正确
- [ ] 防火墙是否阻止连接

**测试命令:**
```bash
# 测试后端 API
curl http://localhost:3456/api/health

# 测试前端代理
curl http://localhost:5173/api/health
```

### Q3: 前端页面显示但报错

**可能原因:**
- 后端服务未启动
- API 路径配置错误
- CORS 问题

**解决方法:**
1. 检查浏览器 Console 错误信息
2. 检查 Network 标签的 API 请求
3. 确认后端服务运行正常

---

## 📊 服务状态检查

### 检查后端进程

```bash
Get-Process -Name node | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-5) }
```

### 检查端口占用

```bash
netstat -ano | findstr :3456
netstat -ano | findstr :5173
```

### 运行自动化测试

```bash
# API 测试
node bin/test-api.js

# 前端连接测试
node bin/test-frontend-connection.js
```

---

## 🎯 快速启动脚本

### Windows PowerShell

创建 `start-dev.ps1`:
```powershell
# 启动后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start"

# 等待 2 秒
Start-Sleep -Seconds 2

# 启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\web-ui'; npm run dev"

# 等待 3 秒后打开浏览器
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173/"
```

运行:
```powershell
.\start-dev.ps1
```

---

## ✅ 验证清单

启动后请检查:

- [ ] 后端服务运行 (终端 1 显示 "Multi-Agent Coordinator is ready!")
- [ ] 前端服务运行 (终端 2 显示 "Local: http://localhost:5173/")
- [ ] 浏览器访问 http://localhost:5173/
- [ ] 页面无空白
- [ ] Console 无错误
- [ ] Network 标签所有请求成功
- [ ] 可以启动会话

---

**记住: 访问 http://localhost:5173/ 而不是 http://localhost:3456/!** 🚀
