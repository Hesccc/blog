import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post, Category, Tag } from '../utils/api';
import { Layout } from '../components/Layout';
import { PostCard } from '../components/PostCard';

// Hero for index page
const IndexHero: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="page-hero page-hero-index">
    <div className="hero-mask" />
    <div className="hero-content">
      <div className="hero-title" style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', marginBottom: '0.5rem' }}>
        ✈️ {title}
      </div>
      <div className="hero-subtitle">{subtitle || '记录技术 · 分享生活 · 散漫而行'}</div>
    </div>
  </div>
);

export const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [siteTitle, setSiteTitle] = useState('散漫的老何');
  const [siteSubtitle, setSiteSubtitle] = useState('记录技术 · 分享生活 · 散漫而行');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getTags().then(setTags).catch(console.error);
    api.getConfig().then(cfg => {
      if (cfg.website_title) setSiteTitle(cfg.website_title);
      if (cfg.homepage_subtitle) setSiteSubtitle(cfg.homepage_subtitle);
    }).catch(console.error);
    document.title = '首页 - 散漫的老何';
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getPosts({ page, per_page: 8, category, tag, search })
      .then(data => {
        setPosts(data.posts);
        setTotal(data.total);
        setPages(data.pages);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载文章失败');
        setLoading(false);
      });
  }, [page, category, tag, search]);

  const handlePageChange = (p: number) => {
    const np = new URLSearchParams(searchParams);
    np.set('page', p.toString());
    setSearchParams(np);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout hero={<IndexHero title={siteTitle} subtitle={siteSubtitle} />}>
      <div className="index-container">



        {/* Filter hint */}
        {(search || category || tag) && (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <span>
              🔍 共找到 <strong style={{ color: 'var(--color-primary)' }}>{total}</strong> 篇文章
              {search && <span>，关键词："{search}"</span>}
              {category && <span>，分类：{categories.find(c => c.slug === category)?.name}</span>}
              {tag && <span>，标签：#{tags.find(t => t.slug === tag)?.name}</span>}
            </span>
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 'bold' }}
            >
              × 清除所有筛选
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="loading-wrap">
            <div>
              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>加载文章中...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>没有找到相关文章</p>
          </div>
        ) : (
          <>
            {posts.map(post => <PostCard key={post.id} post={post} />)}

            {/* Pagination */}
            {pages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  ← 上一页
                </button>
                <span className="page-info">第 {page} / {pages} 页</span>
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
