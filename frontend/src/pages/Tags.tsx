import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Tag, Post } from '../utils/api';
import { Layout } from '../components/Layout';
import { IconBookOpen, IconCalendar, IconTag } from '../components/Icons';
import { PageHeroBanner } from '../components/PageHeroBanner';
import { getDeterministicEmoji } from '../utils/emoji';
import { cleanMarkdownSummary } from '../utils/text';

interface TagWithPosts extends Tag {
  posts: Post[];
}

export const Tags: React.FC = () => {
  const [tags, setTags] = useState<TagWithPosts[]>([]);
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '标签索引 - 散漫的老何';
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
            posts: tagPosts,
          };
        });

        setTags(list);
        if (list.length > 0) {
          setActiveTagId(list[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '加载标签失败');
        setLoading(false);
      });
  }, []);

  const activeTag = tags.find(t => t.id === activeTagId);

  const hero = (
    <PageHeroBanner
      tag="TAG INDEX & DISCOVERY"
      tagIcon={<IconTag size={14} />}
      title="标签索引"
      subtitle={`横切知识网络与碎片化技术笔记 · 共 ${tags.length} 个标签`}
    />
  );

  return (
    <Layout hero={hero}>
      <div className="page-shell">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>正在拉取标签数据...</p>
          </div>
        ) : error ? (
          <div className="alert-box alert-error">{error}</div>
        ) : tags.length === 0 ? (
          <div className="empty-state-box">
            <h3>暂无标签</h3>
            <p>目前还没有创建任何标签。</p>
          </div>
        ) : (
          <div className="tags-interactive-view">
            {/* Tag Cloud Pills */}
            <div className="tags-cloud-box">
              {tags.map(t => {
                const isActive = t.id === activeTagId;
                const emoji = getDeterministicEmoji(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTagId(t.id)}
                    className={`tag-pill-modern ${isActive ? 'is-active' : ''}`}
                  >
                    <span style={{ fontSize: '0.95rem', marginRight: 2 }}>{emoji}</span>
                    <span className="tag-name">{t.name}</span>
                    <span className="tag-count">{t.posts.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Tag's Articles List */}
            {activeTag && (
              <div className="tag-selected-section">
                <div className="tag-section-bar">
                  <span className="tag-current-name">
                    <span style={{ fontSize: '1rem', marginRight: 4 }}>{getDeterministicEmoji(activeTag.name)}</span>
                    <span>{activeTag.name}</span>
                  </span>
                  <span className="tag-current-count">
                    共收录 {activeTag.posts.length} 篇内容
                  </span>
                  <Link to={`/?tag=${activeTag.slug}`} className="tag-explore-link">
                    <IconBookOpen size={13} />
                    <span>在首页聚焦此标签</span>
                  </Link>
                </div>

                {activeTag.posts.length === 0 ? (
                  <div className="tag-empty-post">该标签下暂无关联文章</div>
                ) : (
                    <div className="tag-posts-grid">
                    {activeTag.posts.map(p => {
                      const cleanSummary = cleanMarkdownSummary(p.summary || p.meta_description || p.content, 130);
                      return (
                        <article key={p.id} className="tag-post-card">
                          <Link to={`/posts/${p.id}`} className="tag-post-link">
                            <h4 className="tag-post-title">{p.title}</h4>
                            {cleanSummary && (
                              <p className="tag-post-desc">{cleanSummary}</p>
                            )}
                            <div className="tag-post-meta">
                              <IconCalendar size={12} />
                              <time dateTime={p.create_time}>
                                {new Date(p.create_time).toLocaleDateString('zh-CN')}
                              </time>
                            </div>
                          </Link>
                        </article>
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
