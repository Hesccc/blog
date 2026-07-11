import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { SystemEnv } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';

export const AdminDashboard: React.FC = () => {
  const [envData, setEnvData] = useState<SystemEnv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.adminGetEnv()
      .then(data => {
        setEnvData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '获取系统环境信息失败');
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>数据概览</h2>
        <Link to="/admin/posts/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          ➕ 新增文章
        </Link>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">博客版本</span>
          <span className="metric-value">{envData?.blog_v || 'v1.1.0'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">数据库类型</span>
          <span className="metric-value">{envData?.db_type || 'MySQL'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">系统环境</span>
          <span className="metric-value" style={{ fontSize: '1.1rem' }}>{envData?.os || 'Windows'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">CPU 使用率</span>
          <span className="metric-value">{envData ? `${envData.cpu_usage}%` : '--'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">内存使用率</span>
          <span className="metric-value">{envData ? `${envData.mem_usage}%` : '--'}</span>
        </div>
      </div>

      {/* System Information */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '2rem' }}>🖥️ 系统运行环境</h3>
      {loading ? (
        <div className="loading-wrap" style={{ padding: '2rem' }}>
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
        </div>
      ) : error ? (
        <p style={{ color: '#fc8181' }}>{error}</p>
      ) : envData ? (
        <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {([
            ['运行环境', 'badges'],
            ['Python 版本', envData.python_v],
            ['Flask 版本', envData.flask_v],
            ['SQLAlchemy', envData.SQLAlchemy_v],
            ['Node.js 版本', envData.node_v],
            ['CPU 使用率', `${envData.cpu_usage}%`],
            ['内存使用率', `${envData.mem_usage}%`],
            ['服务器时间', new Date(envData.datetime).toLocaleString('zh-CN')],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
              <span style={{ width: '140px', fontSize: '0.88rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
              {value === 'badges' ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {envData.run_env.split(';').map((item, idx) => {
                    const parts = item.split(':');
                    const name = parts[0]?.trim();
                    const version = parts.slice(1).join(':')?.trim();
                    return (
                      <span 
                        key={idx} 
                        style={{ 
                          background: 'var(--color-primary-light)', 
                          color: 'var(--color-primary)', 
                          padding: '0.2rem 0.65rem', 
                          borderRadius: '12px', 
                          fontSize: '0.78rem', 
                          fontWeight: 600,
                          border: '1px solid rgba(45, 141, 220, 0.18)'
                        }}
                      >
                        {name}: {version}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </AdminLayout>
  );
};
