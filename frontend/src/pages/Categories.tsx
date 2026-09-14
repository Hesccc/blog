import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Category, Post } from '../utils/api';
import { Layout } from '../components/Layout';
import { IconFolder, IconChevronRight, IconBookOpen } from '../components/Icons';
import { PageHeroBanner } from '../components/PageHeroBanner';
import { getDeterministicEmoji } from '../utils/emoji';

interface CategoryWithPosts extends Category {
  posts: Post[];
  isOpen: boolean;
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '专题分类 - 散漫的老何';
    setLoading(true);

    Promise.all([api.getCategories(), api.getPosts({ per_page: 9999 })])
      .then(([cats, postsData]) => {
        const postsList: Post[] = postsData.posts;

        const list: CategoryWithPosts[] = cats.map(cat => {
          const catPosts = postsList.filter(p =>
            p.categories && p.categories.some(c => c.id === cat.id)
          );
          return {
            ...cat,
            posts: catPosts,
            isOpen: false,
          };
        });

        setCategories(list);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载分类失败');
        setLoading(false);
      });
  }, []);

  const toggleCategory = (id: number) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, isOpen: !c.isOpen } : c))
    );
  };

  const totalPosts = categories.reduce((sum, c) => sum + c.posts.length, 0);

  const hero = (
    <PageHeroBanner
      tag="TOPICS & TAXONOMY"
      tagIcon={<IconFolder size={14} />}
      title="专题分类"
      subtitle={`围绕核心技术栈与工程实践的结构化沉淀 · 共 ${categories.length} 个分类，收录 ${totalPosts} 篇内容`}
    />
  );

  return (
    <Layout hero={hero}>
      <div className="page-shell">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>正在拉取分类结构...</p>
          </div>
        ) : error ? (
          <div className="alert-box alert-error">{error}</div>
        ) : categories.length === 0 ? (
          <div className="empty-state-box">
            <h3>暂无分类</h3>
            <p>目前还没有建立任何分类条目。</p>
          </div>
        ) : (
          <div className="category-deck">
            {categories.map(cat => (
              <div key={cat.id} className="category-card">
                <div
                  className="category-card-header"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div className="category-info-left">
                    <span className="category-icon-box" style={{ fontSize: '1.25rem', userSelect: 'none' }}>
                      {getDeterministicEmoji(cat.name)}
                    </span>
                    <div>
                      <h3 className="category-name">{cat.name}</h3>
                      {cat.description && (
                        <p className="category-desc">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="category-info-right">
                    <span className="category-badge">{cat.posts.length} 篇</span>
                    <span className={`category-chevron ${cat.isOpen ? 'is-open' : ''}`}>
                      <IconChevronRight size={16} />
                    </span>
                  </div>
                </div>

                {/* Expanded Post List under Category */}
                {cat.isOpen && (
                  <div className="category-posts-drawer">
                    {cat.posts.length === 0 ? (
                      <p className="drawer-empty">该分类下暂无文章</p>
                    ) : (
                      <ul className="drawer-list">
                        {cat.posts.map(p => (
                          <li key={p.id} className="drawer-item">
                            <Link to={`/posts/${p.id}`} className="drawer-link">
                              <span className="drawer-title">{p.title}</span>
                              <span className="drawer-date">
                                {new Date(p.create_time).toLocaleDateString('zh-CN')}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="drawer-footer">
                      <Link to={`/?category=${cat.slug}`} className="drawer-view-all">
                        <IconBookOpen size={13} />
                        <span>在首页中聚焦此分类</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
