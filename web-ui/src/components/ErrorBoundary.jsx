import { Component } from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // 刷新页面
    window.location.reload()
  }

  handleReport = () => {
    // 可以集成错误报告服务
    console.error('Error report:', {
      error: this.state.error?.toString(),
      stack: this.state.errorInfo?.componentStack,
      timestamp: Date.now()
    })
    alert('错误报告已生成，请查看控制台')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>😵 出错了</h1>
            <p>应用遇到了一个问题，请尝试刷新页面。</p>
            
            {this.state.error && (
              <div className="error-details">
                <strong>错误信息:</strong>
                <pre>{this.state.error.toString()}</pre>
              </div>
            )}
            
            {this.state.errorInfo && (
              <details className="error-stack">
                <summary>查看堆栈信息</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                🔄 刷新页面
              </button>
              <button className="btn" onClick={this.handleReport}>
                📝 生成错误报告
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
