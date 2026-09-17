import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';
import { Layout } from '../components/Layout';
import { ScrollNav } from '../components/ScrollNav';
import { IconArchive, IconFolder } from '../components/Icons';
import { PageHeroBanner } from '../components/PageHeroBanner';

interface MonthGroup {
  month: number;
  posts: Post[];
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
}

export const Archives: React.FC = () => {
  const [groups, setGroups] = useState<YearGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '文章归档 - 散漫的老何';
    setLoading(true);
    api.getPosts({ per_page: 9999 })
      .then(data => {
        const postsList: Post[] = data.posts;
        setTotalCount(postsList.length);

        const yearMap = new Map<number, Map<number, Post[]>>();
        postsList.forEach(post => {
          const date = new Date(post.create_time);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          if (!yearMap.has(year)) {
            yearMap.set(year, new Map());
          }
          const monthMap = yearMap.get(year)!;
          if (!monthMap.has(month)) {
            monthMap.set(month, []);
          }
          monthMap.get(month)!.push(post);
        });

        const sortedGroups: YearGroup[] = Array.from(yearMap.entries())
          .map(([year, monthMap]) => ({
            year,
            months: Array.from(monthMap.entries())
              .map(([month, posts]) => ({ month, posts }))
              .sort((a, b) => b.month - a.month),
          }))
          .sort((a, b) => b.year - a.year);

        setGroups(sortedGroups);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载归档失败');
        setLoading(false);
      });
  }, []);

  const hero = (
    <PageHeroBanner
      tag="CHRONOLOGICAL ARCHIVE"
      tagIcon={<IconArchive size={14} />}
      title="文章归档"
      subtitle={`按时间脉络梳理的技术实践与杂想 · 共计 ${totalCount} 篇文章`}
    />
  );

  return (
    <Layout hero={hero}>
      {/* 右侧上/下滚动导航按钮（滚动后显示） */}
      <ScrollNav />

      <div className="page-shell">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>正在拉取历史脉络...</p>
          </div>
        ) : error ? (
          <div className="alert-box alert-error">{error}</div>
        ) : groups.length === 0 ? (
          <div className="empty-state-box">
            <h3>暂无归档文章</h3>
            <p>目前还没有已发布的文章归档。</p>
          </div>
        ) : (
          <div className="timeline-container">
            {groups.map(group => (
              <section key={group.year} className="timeline-year-group">
                <div className="timeline-year-header">
                  <span className="year-pill">{group.year}</span>
                  <span className="year-count">
                    {group.months.reduce((sum, m) => sum + m.posts.length, 0)} 篇
                  </span>
                </div>
                <div className="timeline-year-body">
                  {group.months.map(monthGroup => (
                    <div key={monthGroup.month} className="timeline-month-group">
                      <div className="timeline-month-header">
                        <span className="month-pill">{String(monthGroup.month).padStart(2, '0')} 月</span>
                        <span className="month-count">{monthGroup.posts.length} 篇</span>
                      </div>
                      <div className="timeline-items">
                        {monthGroup.posts.map(post => {
                          const d = new Date(post.create_time);
                          const day = `${String(d.getDate()).padStart(2, '0')} 日`;
                          return (
                            <article key={post.id} className="timeline-item">
                              <span className="timeline-date">{day}</span>
                              <Link to={`/posts/${post.id}`} className="timeline-title-link">
                                {post.title}
                              </Link>
                              {post.categories && post.categories.length > 0 && (
                                <span className="timeline-cat-badge">
                                  <IconFolder size={11} />
                                  {post.categories[0].name}
                                </span>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
