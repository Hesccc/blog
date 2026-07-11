import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';
import { Layout } from '../components/Layout';

// Archives Hero Banner
const ArchivesHero: React.FC = () => (
  <div className="page-hero">
    <div className="hero-mask" />
    <div className="hero-content">
      <h1 className="hero-title">📂 归档</h1>
      <div className="hero-subtitle">时光荏苒，岁月留痕</div>
    </div>
  </div>
);

interface YearGroup {
  year: number;
  posts: Post[];
}

export const Archives: React.FC = () => {
  const [groups, setGroups] = useState<YearGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '归档 - 散漫的老何';
    setLoading(true);
    api.getPosts({ per_page: 9999 })
      .then(data => {
        const postsList: Post[] = data.posts;
        setTotalCount(postsList.length);

        // Group posts by year
        const map = new Map<number, Post[]>();
        postsList.forEach(post => {
          const date = new Date(post.create_time);
          const year = date.getFullYear();
          if (!map.has(year)) {
            map.set(year, []);
          }
          map.get(year)!.push(post);
        });

        // Convert to sorted array
        const sortedGroups: YearGroup[] = Array.from(map.entries())
          .map(([year, posts]) => ({ year, posts }))
          .sort((a, b) => b.year - a.year);

        setGroups(sortedGroups);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载归档失败');
        setLoading(false);
      });
  }, []);

  return (
    <Layout hero={<ArchivesHero />}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem 0' }}>
        {loading ? (
          <div className="loading-wrap">
            <div>
              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>加载归档中...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '1.5rem' }}>
              📊 目前共计 <strong style={{ color: 'var(--color-primary)' }}>{totalCount}</strong> 篇文章。继续努力！
            </p>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '2rem' }} />

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {groups.map(group => (
                <div key={group.year}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    {group.year}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--color-primary-light)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
                    {group.posts.map(post => {
                      const date = new Date(post.create_time);
                      const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      return (
                        <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '50px' }}>
                            {monthDay}
                          </span>
                          <Link 
                            to={`/posts/${post.id}`} 
                            style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '1.05rem', textDecoration: 'none', transition: 'var(--transition)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                          >
                            {post.title}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
