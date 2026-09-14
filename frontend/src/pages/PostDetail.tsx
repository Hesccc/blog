import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';
import { Layout } from '../components/Layout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Toc } from '../components/Toc';
import {
  IconCalendar,
  IconClock,
  IconEye,
  IconArrowLeft,
  IconUser,
  IconArrowUp,
  IconArrowDown,
} from '../components/Icons';
import { getDeterministicEmoji } from '../utils/emoji';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScrollNav, setShowScrollNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollNav(window.scrollY > 220);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

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
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const wordCount = post?.content ? Math.ceil(post.content.length / 2) : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300));

  return (
    <Layout>
      <div className="post-detail-layout">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>正在载入文章内容...</p>
          </div>
        ) : error || !post ? (
          <div className="empty-state-box">
            <h3>文章不存在或已被删除</h3>
            <p>{error || '未能找到目标文章，请确认链接是否正确。'}</p>
            <Link to="/" className="btn-clean">
              返回首页
            </Link>
          </div>
        ) : (
          <>
            <article className="post-article-container">
              {/* Back to Home / Archives Breadcrumb */}
              <div className="post-breadcrumb">
                <Link to="/" className="breadcrumb-link">
                  <IconArrowLeft size={14} />
                  <span>返回文章流</span>
                </Link>
                {post.categories && post.categories.length > 0 && (
                  <>
                    <span className="breadcrumb-sep">/</span>
                    <Link to={`/?category=${post.categories[0].slug}`} className="breadcrumb-link">
                      {post.categories[0].name}
                    </Link>
                  </>
                )}
              </div>

              {/* Article Header */}
              <header className="post-header">
                {/* Category & Tags Badges */}
                <div className="post-header-badges">
                  {post.categories && post.categories.map(cat => (
                    <Link
                      key={cat.id}
                      to={`/?category=${cat.slug}`}
                      className="post-cat-badge"
                    >
                      <span style={{ fontSize: '0.85rem' }}>{getDeterministicEmoji(cat.name)}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                  {post.tags && post.tags.map(tag => (
                    <Link
                      key={tag.id}
                      to={`/?tag=${tag.slug}`}
                      className="post-tag-badge"
                    >
                      <span style={{ fontSize: '0.78rem' }}>{getDeterministicEmoji(tag.name)}</span>
                      <span>{tag.name}</span>
                    </Link>
                  ))}
                </div>

                {/* Article Title */}
                <h1 className="post-title">{post.title}</h1>

                {/* Article Meta Bar */}
                <div className="post-meta-row">
                  <div className="meta-left">
                    <span className="meta-item">
                      <IconCalendar size={14} />
                      <time dateTime={post.create_time}>{formattedDate}</time>
                    </span>
                    <span className="meta-dot">·</span>
                    <span className="meta-item">
                      <IconClock size={14} />
                      <span>约 {readMinutes} 分钟阅读 ({wordCount.toLocaleString()} 字)</span>
                    </span>
                    <span className="meta-dot">·</span>
                    <span className="meta-item">
                      <IconEye size={14} />
                      <span>{post.access_count} 次浏览</span>
                    </span>
                  </div>
                  {post.author && (
                    <div className="meta-right">
                      <span className="meta-author">
                        <IconUser size={13} />
                        <span>{post.author}</span>
                      </span>
                    </div>
                  )}
                </div>
              </header>

              {/* Optional Post Feature Image */}
              {post.thumbnail && (
                <div className="post-feature-image-wrap">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="post-feature-image"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Article Markdown Content */}
              <div className="post-content-wrap">
                <MarkdownRenderer content={post.content || ''} />
              </div>

              {/* Article Footer */}
              <footer className="post-footer">
                <div className="post-footer-actions">
                  <Link to="/archives" className="btn-clean">
                    <IconArrowLeft size={14} />
                    <span>查看全部归档</span>
                  </Link>
                </div>
              </footer>
            </article>

            {/* Sidebar Table of Contents (TOC) */}
            <aside className="post-sidebar">
              <div className="post-sidebar-sticky">
                <div className="toc-header-label">
                  <span>文章目录</span>
                </div>
                <Toc content={post.content || ''} />
              </div>
            </aside>

            {/* Quick Float Scroll Actions (至顶部 / 至底部) */}
            <div className={`float-scroll-pill ${showScrollNav ? 'is-visible' : ''}`}>
              <button
                type="button"
                className="scroll-pill-btn"
                onClick={scrollToTop}
                title="回到顶部 (Top)"
                aria-label="回到顶部"
              >
                <IconArrowUp size={16} />
                <span className="scroll-btn-text">回到顶部</span>
              </button>
              <div className="scroll-pill-divider" />
              <button
                type="button"
                className="scroll-pill-btn"
                onClick={scrollToBottom}
                title="直达底部 (Down)"
                aria-label="直达底部"
              >
                <IconArrowDown size={16} />
                <span className="scroll-btn-text">直达底部</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
