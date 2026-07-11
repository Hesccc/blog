import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';
import { Layout } from '../components/Layout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Toc } from '../components/Toc';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getPost(parseInt(id, 10))
      .then(data => {
        setPost(data);
        setLoading(false);
        document.title = `${data.title} - 散漫的老何`;
      })
      .catch(err => {
        setError(err.message || '加载文章详情失败');
        setLoading(false);
      });
  }, [id]);

  const formattedDate = post
    ? new Date(post.create_time).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const wordCount = post?.content ? Math.ceil(post.content.length / 2) : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300));

  // Hero Banner (shown as the layout's hero slot)
  const heroBanner = post ? (
    <div className="page-hero">
      <div className="hero-mask" />
      <div className="hero-content">
        <div style={{ marginBottom: '1rem' }}>
          {post.categories && post.categories.map(cat => (
            <span
              key={cat.id}
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                marginRight: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              📁 {cat.name}
            </span>
          ))}
          {post.tags && post.tags.map(tag => (
            <span
              key={tag.id}
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                marginRight: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              🏷️ #{tag.name}
            </span>
          ))}
        </div>
        <h1 className="hero-title">{post.title}</h1>
        <div className="hero-meta">
          <span className="hero-meta-item">📅 {formattedDate}</span>
          <span className="hero-meta-item">✍️ {post.author}</span>
          <span className="hero-meta-item">📖 {wordCount.toLocaleString()} 字</span>
          <span className="hero-meta-item">⏱️ 约 {readMinutes} 分钟阅读</span>
          <span className="hero-meta-item">👁️ {post.access_count} 次查看</span>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <Layout hero={post ? heroBanner : undefined}>
      {loading ? (
        <div className="loading-wrap">
          <div>
            <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>正在载入文章内容...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : post ? (
        <div className="post-layout">
          {/* Main Article */}
          <main>
            <button onClick={() => navigate(-1)} className="back-btn">← 返回</button>
            <article className="post-article">
              <div className="markdown-body">
                <MarkdownRenderer content={post.content || ''} />
              </div>

              {/* Tags footer */}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags-footer">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>🏷️ 标签：</span>
                  {post.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="tag-badge"
                      style={{ color: tag.color, borderColor: `${tag.color}40`, background: `${tag.color}14` }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </main>

          {/* TOC */}
          <aside className="post-toc-col">
            <Toc content={post.content || ''} />
          </aside>
        </div>
      ) : null}
    </Layout>
  );
};
