import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('blog_token');
    if (!token) {
      navigate('/login');
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-wrap">
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          <p style={{ marginTop: '1rem' }}>验证身份中...</p>
        </div>
      </div>
    );
  }

  const username = localStorage.getItem('blog_username') || 'Admin';

  return (
    <div className="admin-wrapper">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <div>⚙️ 管理控制台</div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>
              👤 {username}
            </div>
          </div>

          <ul className="admin-menu">
            <li className="admin-menu-item">
              <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
                📊 数据概览
              </NavLink>
            </li>
            <li className="admin-menu-item">
              <NavLink to="/admin/posts" className={({ isActive }) => isActive ? 'active' : ''}>
                📝 文章管理
              </NavLink>
            </li>
            <li className="admin-menu-item">
              <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'active' : ''}>
                📁 分类管理
              </NavLink>
            </li>
            <li className="admin-menu-item">
              <NavLink to="/admin/tags" className={({ isActive }) => isActive ? 'active' : ''}>
                🏷️ 标签管理
              </NavLink>
            </li>
            <li className="admin-menu-item">
              <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                ⚙️ 系统设置
              </NavLink>
            </li>
          </ul>

          {/* Bottom actions */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              🏠 返回博客
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '0' }}
            >
              🚪 退出登录
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};
