import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Tag, Post } from '../utils/api';
import { Layout } from '../components/Layout';

const TagsHero: React.FC = () => (
  <div className="page-hero">
    <div className="hero-mask" />
    <div className="hero-content">
      <h1 className="hero-title">🏷️ 标签</h1>
      <div className="hero-subtitle">标注文档，聚合内容</div>
    </div>
  </div>
);

interface TagWithPosts extends Tag {
  posts: Post[];
}

export const Tags: React.FC = () => {
  const [tags, setTags] = useState<TagWithPosts[]>([]);
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '标签 - 散漫的老何';
    setLoading(true);

    Promise.all([api.getTags(), api.getPosts({ per_page: 9999 })])
      .then(([tagsList, postsData]) => {
        const postsList: Post[] = postsData.posts;

        const list: TagWithPosts[] = tagsList.map(tag => {
          const tagPosts = postsList.filter(p => 
            p.tags && p.tags.some(t => t.id === tag.id)
          );
          return {
            ...tag,
            posts: tagPosts
          };
        });

        setTags(list);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载标签失败');
        setLoading(false);
      });
  }, []);

  const activeTag = tags.find(t => t.id === activeTagId);

  return (
    <Layout hero={<TagsHero />}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem 0' }}>
        {loading ? (
          <div className="loading-wrap">
            <div>
              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>加载标签中...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏷️ 共包含 <strong style={{ color: 'var(--color-primary)' }}>{tags.length}</strong> 个标签
            </h2>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '2rem' }} />

            {/* Tag Cloud */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
              {tags.map(tag => {
                const isSelected = activeTagId === tag.id;
                // Calculate scale size based on post count (min 0.85rem, max 1.5rem)
                const count = tag.posts.length;
                const fontSize = `${Math.min(1.5, Math.max(0.85, 0.85 + count * 0.08))}rem`;
                
                return (
                  <button
                    key={tag.id}
                    onClick={() => setActiveTagId(isSelected ? null : tag.id)}
                    style={{
                      display: 'inline-block',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: fontSize,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#fff' : tag.color || 'var(--color-primary)',
                      border: `1px solid ${isSelected ? (tag.color || 'var(--color-primary)') : (tag.color ? `${tag.color}40` : 'rgba(45,141,220,0.2)')}`,
                      backgroundColor: isSelected ? (tag.color || 'var(--color-primary)') : (tag.color ? `${tag.color}14` : 'var(--bg-tag)'),
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = tag.color || 'var(--color-primary)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = tag.color ? `${tag.color}14` : 'var(--bg-tag)';
                        e.currentTarget.style.color = tag.color || 'var(--color-primary)';
                      }
                    }}
                  >
                    #{tag.name} <span style={{ fontSize: '0.8em', opacity: 0.75 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Tag Posts list */}
            {activeTag && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1.25rem' }}>
                  标签 <span style={{ color: activeTag.color }}>#{activeTag.name}</span> 下的文章：
                </h3>
                {activeTag.posts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>该标签下暂无文章</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    {activeTag.posts.map(post => {
                      const date = new Date(post.create_time);
                      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      return (
                        <div key={post.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                          <Link 
                            to={`/posts/${post.id}`} 
                            style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'var(--transition)', fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                          >
                            📄 {post.title}
                          </Link>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                            {formattedDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
