import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';

interface LayoutProps {
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, hero }) => {
  const [config, setConfig] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('blog_config');
      return cached ? JSON.parse(cached) : {};
    } catch {}
    return {};
  });
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  
  // Search Modal States
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 动态 favicon 更新
  useEffect(() => {
    if (config.website_icon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.website_icon;
    }
  }, [config.website_icon]);

  // 全局动态网页标题更新（支持“首页 - ${title}”，“标签 - ${title}”格式）
  useEffect(() => {
    const updateTitle = () => {
      const baseTitle = config.website_title || '散漫的老何';
      const currentTitle = document.title;
      if (currentTitle.endsWith(' - 后台管理') || currentTitle === '登录 - 后台管理') {
        return;
      }
      if (currentTitle.includes(' - ')) {
        const parts = currentTitle.split(' - ');
        const prefix = parts[0];
        const newTitle = `${prefix} - ${baseTitle}`;
        if (document.title !== newTitle) {
          document.title = newTitle;
        }
      } else {
        const newTitle = `${currentTitle} - ${baseTitle}`;
        if (document.title !== newTitle) {
          document.title = newTitle;
        }
      }
    };

    updateTitle();
    const timer = setTimeout(updateTitle, 60);
    return () => clearTimeout(timer);
  }, [config.website_title, children]);

  // Fetch all posts once when search is opened
  const handleOpenSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    
    // Auto focus input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    if (allPosts.length === 0) {
      setLoadingSearch(true);
      api.getPosts({ per_page: 9999 })
        .then(data => {
          setAllPosts(data.posts);
          setLoadingSearch(false);
        })
        .catch(err => {
          console.error('Failed to load posts for search', err);
          setLoadingSearch(false);
        });
    }
  };

  // Handle Search Input Change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allPosts.filter(post => 
      post.title.toLowerCase().includes(query) || 
      (post.content && post.content.toLowerCase().includes(query))
    );
    setSearchResults(filtered.slice(0, 10)); // Limit to top 10 results
  }, [searchQuery, allPosts]);

  // Handle Close Search on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    if (showSearch) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const siteTitle = config.website_title || '散漫的老何';
  const siteICP = config.website_icp || '湘ICP备20003211号-1';

  return (
    <div className="site-wrapper">
      {/* Fixed Navbar */}
      <nav className="navbar" style={scrolled ? { boxShadow: '0 2px 16px rgba(0,0,0,0.12)' } : {}}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">✈️</span>
            {siteTitle}
          </Link>

          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                🏠 首页
              </NavLink>
            </li>
            <li>
              <NavLink to="/archives" className={({ isActive }) => isActive ? 'active' : ''}>
                📂 归档
              </NavLink>
            </li>
            <li>
              <NavLink to="/categories" className={({ isActive }) => isActive ? 'active' : ''}>
                📁 分类
              </NavLink>
            </li>
            <li>
              <NavLink to="/tags" className={({ isActive }) => isActive ? 'active' : ''}>
                🏷️ 标签
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                👤 关于
              </NavLink>
            </li>
            {/* Search Trigger NavLink */}
            <li>
              <button 
                onClick={handleOpenSearch} 
                className="nav-link-btn" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  padding: '0.4rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  borderRadius: '6px',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                🔍 搜索
              </button>
            </li>
            {/* Theme Toggle Trigger */}
            <li>
              <button 
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                className="nav-link-btn" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  padding: '0.4rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  borderRadius: '6px',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero or spacer */}
      {hero ? hero : <div style={{ height: 'var(--navbar-height)' }} />}

      {/* Page Body */}
      <div className="page-body">
        {children}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} {siteTitle}. All Rights Reserved.</p>
        <p>
          Powered by Flask &amp; React ·&nbsp;
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{siteICP}</a>
        </p>
      </footer>

      {/* Search Modal Overlay */}
      {showSearch && (
        <div className="search-modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="search-modal-container" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="search-modal-header">
              <div className="search-modal-input-wrapper">
                <span>🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索文章标题或内容..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="search-modal-close" onClick={() => setShowSearch(false)}>
                &times;
              </button>
            </div>

            {/* Results */}
            <ul className="search-modal-results">
              {loadingSearch ? (
                <div className="loading-wrap" style={{ padding: '2rem' }}>
                  <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>正在初始化搜索索引...</p>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  没有找到包含 "{searchQuery}" 的文章
                </div>
              ) : !searchQuery ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  输入关键词，开启全站智能瞬时搜索
                </div>
              ) : (
                searchResults.map(post => {
                  const plainContent = post.content ? post.content.replace(/[#*`_[\]()>]/g, '').trim() : '';
                  return (
                    <li key={post.id} className="search-result-item" onClick={() => setShowSearch(false)}>
                      <Link to={`/posts/${post.id}`}>
                        <div className="search-result-title">{post.title}</div>
                        {plainContent && (
                          <div className="search-result-preview">{plainContent}</div>
                        )}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
