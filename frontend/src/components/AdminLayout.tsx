import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('blog_token');
    return !token;
  });
  const [blogTitle, setBlogTitle] = useState(() => {
    try {
      const cached = localStorage.getItem('blog_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.website_title || '散漫的老何';
      }
    } catch { }
    return '散漫的老何';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('blog_token');
    if (!token) {
      navigate('/login');
    } else {
      setLoading(false);
      api.getConfig().then(data => {
        if (data && data.website_title) {
          setBlogTitle(data.website_title);
        }
      }).catch(console.error);
    }
  }, [navigate]);

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = '后台管理';

    if (path === '/admin') {
      pageTitle = '数据概览';
    } else if (path === '/admin/posts') {
      pageTitle = '文章管理';
    } else if (path === '/admin/posts/new') {
      pageTitle = '新建文章';
    } else if (path.startsWith('/admin/posts/edit/')) {
      pageTitle = '编辑文章';
    } else if (path === '/admin/categories') {
      pageTitle = '分类管理';
    } else if (path === '/admin/tags') {
      pageTitle = '标签管理';
    } else if (path === '/admin/oss-images') {
      pageTitle = '图片库管理';
    } else if (path === '/admin/settings') {
      pageTitle = '系统设置';
    }

    document.title = `${pageTitle} - 后台管理`;
  }, [location.pathname]);

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
              <NavLink to="/admin/oss-images" className={({ isActive }) => isActive ? 'active' : ''}>
                🖼️ 图片库
              </NavLink>
            </li>
            <li className="admin-menu-item">
              <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                ⚙️ 系统设置
              </NavLink>
            </li>

          </ul>

          {/* Bottom actions */}
          <div className="admin-sidebar-footer">
            <Link to="/" className="admin-sidebar-footer-btn">
              <span>🏠</span> 返回主页
            </Link>
            <button onClick={handleLogout} className="admin-sidebar-footer-btn">
              <span>🚪</span> 退出登录
            </button>
            <div className="admin-sidebar-copyright">
              © 2005-2026 {blogTitle}
              <div style={{ fontSize: '0.62rem', marginTop: '0.2rem', opacity: 0.65 }}>
                v1.1.0 (Build 20260714)
              </div>
            </div>
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
