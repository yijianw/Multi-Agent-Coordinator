/**
 * HTTP Server - 提供 REST API
 */

import http from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { coordinator } from '../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

/**
 * HTTP 服务器类
 */
export class HttpServer {
  constructor(port = 3456) {
    this.port = port
    this.server = null
    this.routes = new Map()
    this._setupRoutes()
  }

  /**
   * 设置路由
   */
  _setupRoutes() {
    // GET /api/health - 健康检查
    this.register('GET', '/api/health', (req, res) => {
      this._json(res, { status: 'ok', timestamp: Date.now() })
    })

    // GET /api/agent-types - 获取可用 Agent 类型
    this.register('GET', '/api/agent-types', (req, res) => {
      this._json(res, coordinator.getAgentTypes())
    })

    // GET /api/workflow-modes - 获取工作流模式
    this.register('GET', '/api/workflow-modes', (req, res) => {
      this._json(res, coordinator.getWorkflowModes())
    })

    // POST /api/session/start - 启动会话
    this.register('POST', '/api/session/start', async (req, res) => {
      try {
        const body = await this._parseBody(req)
        const result = await coordinator.startSession(body)
        this._json(res, result)
      } catch (error) {
        this._error(res, error.message)
      }
    })

    // GET /api/session/status - 获取会话状态
    this.register('GET', '/api/session/status', (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`)
      const sessionId = url.searchParams.get('sessionId')
      const result = coordinator.getSessionStatus(sessionId)
      this._json(res, result)
    })

    // POST /api/session/stop - 停止会话
    this.register('POST', '/api/session/stop', async (req, res) => {
      try {
        const body = await this._parseBody(req)
        const result = coordinator.stopSession(body.sessionId)
        this._json(res, result)
      } catch (error) {
        this._error(res, error.message)
      }
    })

    // GET /api/session/report - 获取报告
    this.register('GET', '/api/session/report', (req, res) => {
      const report = coordinator.getLastReport()
      if (report) {
        this._json(res, report)
      } else {
        this._json(res, { error: 'No report available' }, 404)
      }
    })

    // GET /api/session/report/export - 导出 Markdown 报告
    this.register('GET', '/api/session/report/export', (req, res) => {
      const result = coordinator.exportReport()
      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'text/markdown' })
        res.end(result.markdown)
      } else {
        this._json(res, result, 404)
      }
    })

    // GET / - 服务前端静态文件
    this.register('GET', '/', (req, res) => {
      this._serveStatic('index.html', res)
    })
    
    // 服务静态资源 (CSS, JS, 图片等)
    this.register('GET', '/assets/', (req, res) => {
      this._serveStaticFile(req.url, res)
    })
  }

  /**
   * 注册路由
   */
  register(method, path, handler) {
    this.routes.set(`${method.toUpperCase()} ${path}`, handler)
  }

  /**
   * 启动服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${this.port}`)
        const key = `${req.method.toUpperCase()} ${url.pathname}`
        
        console.log(`[HttpServer] ${req.method} ${url.pathname}`)
        
        const handler = this.routes.get(key)
        
        if (handler) {
          try {
            await handler(req, res)
          } catch (error) {
            console.error('[HttpServer] Handler error:', error)
            this._error(res, error.message, 500)
          }
        } else {
          this._error(res, 'Not Found', 404)
        }
      })

      this.server.listen(this.port, () => {
        console.log(`[HttpServer] Listening on http://localhost:${this.port}`)
        resolve()
      })

      this.server.on('error', (error) => {
        console.error('[HttpServer] Server error:', error)
        reject(error)
      })
    })
  }

  /**
   * 停止服务器
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[HttpServer] Server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 发送 JSON 响应
   */
  _json(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  /**
   * 发送错误响应
   */
  _error(res, message, status = 400) {
    this._json(res, { error: message }, status)
  }

  /**
   * 解析请求体
   */
  async _parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch (error) {
          reject(new Error('Invalid JSON'))
        }
      })
      req.on('error', reject)
    })
  }

  /**
   * 服务静态文件
   */
  _serveStatic(filename, res) {
    try {
      const filePath = join(__dirname, '..', 'web-ui', 'dist', filename)
      const content = readFileSync(filePath, 'utf-8')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(content)
    } catch (error) {
      this._error(res, 'Frontend not built yet. Run: npm run build', 404)
    }
  }

  /**
   * 服务静态资源文件
   */
  _serveStaticFile(urlPath, res) {
    try {
      const filename = urlPath.replace('/assets/', '')
      const filePath = join(__dirname, '..', 'web-ui', 'dist', 'assets', filename)
      const content = readFileSync(filePath)
      
      // 根据扩展名设置 Content-Type
      const ext = filename.split('.').pop().toLowerCase()
      const contentTypes = {
        'css': 'text/css',
        'js': 'application/javascript',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
      }
      
      const contentType = contentTypes[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch (error) {
      this._error(res, 'File not found', 404)
    }
  }
}

// 导出单例
export const httpServer = new HttpServer(config.server.httpPort)
