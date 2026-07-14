import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Layout } from '../components/Layout';

const AboutHero: React.FC = () => (
  <div className="page-hero">
    <div className="hero-mask" />
    <div className="hero-content">
      <h1 className="hero-title">👤 关于</h1>
      <div className="hero-subtitle">关于我，关于这个站点</div>
    </div>
  </div>
);

export const About: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('blog_config');
      return cached ? JSON.parse(cached) : {};
    } catch {}
    return {};
  });
  const [loading, setLoading] = useState(() => Object.keys(config).length === 0);

  useEffect(() => {
    document.title = '关于 - 散漫的老何';
    api.getConfig()
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const siteTitle = config.website_title || '需要哈气的纸飞机';
  const siteDesc = config.website_desc || '感谢关注我的网站，本站是使用 Flask + React 架构进行搭建。对文章有任何疑惑或建议，欢迎联系我！';

  return (
    <Layout hero={<AboutHero />}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
        {loading ? (
          <div className="loading-wrap">
            <div>
              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>加载中...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            
            {/* Avatar and Profile Card */}
            <div style={{
              width: '100%',
              background: 'var(--bg-card)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              padding: '3rem 2rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              textAlign: 'center'
            }}>
              
              {/* Avatar Shield */}
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #2d8ddc 100%)',
                boxShadow: '0 8px 24px rgba(45,141,220,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem',
                border: '4px solid #fff',
                position: 'absolute',
                top: '-55px',
                zIndex: 1,
                userSelect: 'none'
              }}>
                ✈️
              </div>

              <div style={{ marginTop: '30px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                  {siteTitle}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                  {config.about_profile_subtitle || '💻 不专业的黑客 / 安全运营 / Splunk专家 / 技术博主'}
                </p>
                
                {/* Social links */}
                <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <a 
                    href="https://github.com/Hesccc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '1.25rem',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    🐙
                  </a>
                  <a 
                    href="mailto:mr.hesc@outlook.com"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '1.25rem',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    ✉️
                  </a>
                </div>
              </div>
 
              <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '1.5rem' }} />
 
              {/* Bio description */}
              <div style={{ maxWidth: '600px', lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '1.05rem', textAlign: 'left', width: '100%' }}>
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
                  {config.about_content || siteDesc}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
};
