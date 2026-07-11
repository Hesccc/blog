import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Category, Post } from '../utils/api';
import { Layout } from '../components/Layout';

const CategoriesHero: React.FC = () => (
  <div className="page-hero">
    <div className="hero-mask" />
    <div className="hero-content">
      <h1 className="hero-title">📁 分类</h1>
      <div className="hero-subtitle">分类整理，精准检索</div>
    </div>
  </div>
);

interface CategoryWithPosts extends Category {
  posts: Post[];
  isOpen: boolean;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '分类 - 散漫的老何';
    setLoading(true);

    Promise.all([api.getCategories(), api.getPosts({ per_page: 9999 })])
      .then(([cats, postsData]) => {
        const postsList: Post[] = postsData.posts;

        // Map categories and filter their posts
        const list: CategoryWithPosts[] = cats.map(cat => {
          const catPosts = postsList.filter(p => 
            p.categories && p.categories.some(c => c.id === cat.id)
          );
          return {
            ...cat,
            posts: catPosts,
            isOpen: false
          };
        });

        // Filter out categories with no posts or keep all of them
        setCategories(list);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载分类数据失败');
        setLoading(false);
      });
  }, []);

  const toggleCategory = (id: number) => {
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, isOpen: !c.isOpen } : c
    ));
  };

  return (
    <Layout hero={<CategoriesHero />}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem 0' }}>
        {loading ? (
          <div className="loading-wrap">
            <div>
              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>加载分类中...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📁 共包含 <strong style={{ color: 'var(--color-primary)' }}>{categories.length}</strong> 个分类
            </h2>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '1.5rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', background: cat.isOpen ? 'var(--color-primary-light)' : 'transparent', transition: 'var(--transition)' }}
                >
                  {/* Category Header */}
                  <div 
                    onClick={() => toggleCategory(cat.id)}
                    style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-heading)' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color || '#2d8ddc' }} />
                      {cat.name}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        ({cat.posts.length} 篇)
                      </span>
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', transform: cat.isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▶
                    </span>
                  </div>

                  {/* Collapsible Posts List */}
                  {cat.isOpen && (
                    <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem' }}>
                      {cat.posts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>该分类下暂无文章</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {cat.posts.map(post => {
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
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
