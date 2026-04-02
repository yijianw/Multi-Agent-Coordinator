/**
 * Storage Service - 本地存储服务
 * 使用 localStorage 持久化会话历史、配置等
 */

const STORAGE_KEYS = {
  SESSIONS: 'mac_sessions',
  CONFIGS: 'mac_configs',
  PREFERENCES: 'mac_preferences'
}

export class StorageService {
  /**
   * 保存会话历史
   */
  saveSession(sessionData) {
    try {
      const sessions = this.getSessions()
      const newSession = {
        ...sessionData,
        id: sessionData.id || `session-${Date.now()}`,
        createdAt: sessionData.createdAt || Date.now(),
        updatedAt: Date.now(),
        status: sessionData.status || 'completed'
      }
      
      sessions.unshift(newSession)
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
      
      return newSession
    } catch (error) {
      console.error('Failed to save session:', error)
      return null
    }
  }

  /**
   * 获取所有会话历史
   */
  getSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get sessions:', error)
      return []
    }
  }

  /**
   * 获取单个会话
   */
  getSession(sessionId) {
    try {
      const sessions = this.getSessions()
      return sessions.find(s => s.id === sessionId) || null
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * 更新会话状态
   */
  updateSessionStatus(sessionId, status, logs = []) {
    try {
      const sessions = this.getSessions()
      const index = sessions.findIndex(s => s.id === sessionId)
      
      if (index !== -1) {
        sessions[index] = {
          ...sessions[index],
          status,
          logs: [...(sessions[index].logs || []), ...logs],
          updatedAt: Date.now()
        }
        
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
        return sessions[index]
      }
      
      return null
    } catch (error) {
      console.error('Failed to update session status:', error)
      return null
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId) {
    try {
      const sessions = this.getSessions()
      const filtered = sessions.filter(s => s.id !== sessionId)
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  /**
   * 清空所有会话
   */
  clearSessions() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS)
      return true
    } catch (error) {
      console.error('Failed to clear sessions:', error)
      return false
    }
  }

  /**
   * 保存配置
   */
  saveConfig(configName, configData) {
    try {
      const configs = this.getConfigs()
      configs[configName] = {
        ...configData,
        updatedAt: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs))
      return true
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  }

  /**
   * 获取所有配置
   */
  getConfigs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIGS)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to get configs:', error)
      return {}
    }
  }

  /**
   * 获取单个配置
   */
  getConfig(configName) {
    try {
      const configs = this.getConfigs()
      return configs[configName] || null
    } catch (error) {
      console.error('Failed to get config:', error)
      return null
    }
  }

  /**
   * 删除配置
   */
  deleteConfig(configName) {
    try {
      const configs = this.getConfigs()
      delete configs[configName]
      localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs))
      return true
    } catch (error) {
      console.error('Failed to delete config:', error)
      return false
    }
  }

  /**
   * 保存偏好设置
   */
  savePreferences(prefs) {
    try {
      const existing = this.getPreferences()
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ ...existing, ...prefs })
      )
      return true
    } catch (error) {
      console.error('Failed to save preferences:', error)
      return false
    }
  }

  /**
   * 获取偏好设置
   */
  getPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to get preferences:', error)
      return {}
    }
  }

  /**
   * 获取存储使用量 (字节)
   */
  getStorageUsage() {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total * 2 // UTF-16 编码，每个字符 2 字节
  }

  /**
   * 导出所有数据
   */
  exportAll() {
    return {
      sessions: this.getSessions(),
      configs: this.getConfigs(),
      preferences: this.getPreferences(),
      exportedAt: Date.now()
    }
  }

  /**
   * 导入数据
   */
  importAll(data) {
    try {
      if (data.sessions) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions))
      }
      if (data.configs) {
        localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(data.configs))
      }
      if (data.preferences) {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(data.preferences))
      }
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
}

// 导出单例
export const storageService = new StorageService()
