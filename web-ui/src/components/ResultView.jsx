import './ResultView.css'

function ResultView({ report }) {
  if (!report) return null

  const { summary, agents, consolidated } = report

  return (
    <div className="result-view">
      {/* 摘要 */}
      <div className="result-summary">
        <h3>📊 执行摘要</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Agent 总数</span>
            <span className="value">{summary.totalAgents}</span>
          </div>
          <div className="summary-item">
            <span className="label">完成数量</span>
            <span className="value">{summary.completedAgents}</span>
          </div>
          <div className="summary-item">
            <span className="label">成功率</span>
            <span className="value">{summary.successRate}%</span>
          </div>
          <div className="summary-item">
            <span className="label">总耗时</span>
            <span className="value">{(summary.totalDuration / 1000).toFixed(1)}s</span>
          </div>
          <div className="summary-item">
            <span className="label">平均耗时</span>
            <span className="value">{(summary.avgDuration / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Agent 结果 */}
      <div className="agent-results">
        <h3>📋 Agent 结果</h3>
        {agents.map((agent, index) => (
          <div key={agent.id} className={`agent-result-card ${agent.status}`}>
            <div className="agent-result-header">
              <span className="agent-icon">{agent.icon}</span>
              <span className="agent-name">{agent.name}</span>
              <span className={`agent-status ${agent.status}`}>
                {agent.status === 'completed' ? '✅ 完成' : 
                 agent.status === 'failed' ? '❌ 失败' : 
                 agent.status === 'stopped' ? '⏹️ 停止' : '⏳ 进行中'}
              </span>
            </div>
            <div className="agent-result-body">
              <div className="result-field">
                <strong>角色:</strong> {agent.role}
              </div>
              <div className="result-field">
                <strong>进度:</strong> {agent.progress}%
              </div>
              <div className="result-field">
                <strong>耗时:</strong> {(agent.duration / 1000).toFixed(1)}s
              </div>
              {agent.result && (
                <div className="result-field">
                  <strong>结果:</strong>
                  <div className="result-content">
                    {agent.result.summary || '无结果'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 整合结果 */}
      {consolidated && (
        <div className="consolidated-result">
          <h3>🔗 整合结果 ({consolidated.type})</h3>
          <div className="consolidated-content">
            {consolidated.type === 'pipeline' && (
              <div>
                <div className="pipeline-flow">
                  {consolidated.flow?.map((step, index) => (
                    <div key={index} className="pipeline-step">
                      <span className="step-number">{step.step}</span>
                      <span className="step-summary">{step.summary}</span>
                    </div>
                  ))}
                </div>
                {consolidated.finalResult && (
                  <div className="final-result">
                    <strong>最终结果:</strong>
                    <pre>{JSON.stringify(consolidated.finalResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {consolidated.type === 'parallel' && (
              <div>
                <div className="parallel-summaries">
                  {consolidated.summaries?.map((s, index) => (
                    <div key={index} className="parallel-item">
                      <strong>{s.agentId}:</strong> {s.summary}
                    </div>
                  ))}
                </div>
                {consolidated.commonThemes && (
                  <div className="common-themes">
                    <strong>共同主题:</strong>
                    <div className="theme-tags">
                      {consolidated.commonThemes.map((theme, index) => (
                        <span key={index} className="theme-tag">{theme}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {consolidated.type === 'discussion' && (
              <div>
                <div className="contributions">
                  {consolidated.contributions?.map((c, index) => (
                    <div key={index} className="contribution">
                      <strong>{c.agentId}:</strong>
                      <p>{c.contribution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {consolidated.type === 'hybrid' && (
              <div>
                {consolidated.stages?.map((stage, index) => (
                  <div key={index} className="hybrid-stage">
                    <h4>阶段 {stage.stage}</h4>
                    {stage.results?.map((r, i) => (
                      <div key={i} className="stage-result">
                        <strong>{r.agentId}:</strong>
                        <p>{r.result?.summary || '无结果'}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      <div className="result-actions">
        <button
          className="btn btn-primary"
          onClick={() => window.open('/api/session/report/export', '_blank')}
        >
          📥 导出 Markdown 报告
        </button>
      </div>
    </div>
  )
}

export default ResultView
