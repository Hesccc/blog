import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../utils/api';
import { IconCalendar, IconEye, IconClock } from './Icons';
import { getDeterministicEmoji } from '../utils/emoji';
import { cleanMarkdownSummary } from '../utils/text';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = new Date(post.create_time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // 优先展示 AI 生成的 summary 摘要字段，其次 fallback 到经过专业清洗的文本
  const summary = cleanMarkdownSummary(post.summary || post.meta_description || post.content, 110);

  const wordCount = post.word_count !== undefined ? post.word_count : (post.content ? Math.ceil(post.content.length / 2) : 0);
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300));
  const category = post.categories && post.categories.length > 0 ? post.categories[0] : null;

  // 封面优先级：
  // 1. 文章自带 thumbnail
  // 2. 自动获取并缓存在服务端的确定性外部高质图 /api/posts/:id/cover
  const coverUrl = (post.thumbnail && post.thumbnail.trim().length > 0)
    ? post.thumbnail.trim()
    : `/api/posts/${post.id}/cover`;

  return (
    <article className="post-card-item">
      <Link to={`/posts/${post.id}`} className="post-card-link">
        {/* Thumbnail with Deterministic Cache & Graceful Blueprint Fallback */}
        <div className="post-card-cover-wrap">
          <img
            src={coverUrl}
            alt={post.title}
            className="post-card-img"
            loading="lazy"
            onError={(e) => {
              // 若图片加载失败（如断网），降级为现代工程几何蓝图排版
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.post-card-geometric-cover') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }
            }}
          />
          <div className="post-card-geometric-cover" style={{ display: 'none' }}>
            <div className="geometric-grid" />
            <div className="geometric-meta">
              <span className="geometric-badge">{category ? category.name : 'ARTICLE'}</span>
              <span className="geometric-num">#{String(post.id).padStart(3, '0')}</span>
            </div>
            <div className="geometric-initials">
              {post.title ? post.title.slice(0, 2).toUpperCase() : 'PS'}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="post-card-body">
          {/* Categories & Tags Bar */}
          <div className="post-card-meta-top">
            {category && (
              <span className="post-card-category-pill">
                <span style={{ fontSize: '0.85rem' }}>{getDeterministicEmoji(category.name)}</span>
                <span>{category.name}</span>
              </span>
            )}
            {post.tags && post.tags.slice(0, 2).map((t) => (
              <span key={t.id} className="post-card-tag-simple">
                <span style={{ fontSize: '0.78rem', marginRight: 2 }}>{getDeterministicEmoji(t.name)}</span>
                <span>{t.name}</span>
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="post-card-title">{post.title}</h2>

          {/* Summary */}
          {summary && <p className="post-card-excerpt">{summary}</p>}

          {/* Bottom Info Row */}
          <div className="post-card-meta-bottom">
            <span className="meta-item">
              <IconCalendar size={13} />
              <time dateTime={post.create_time}>{formattedDate}</time>
            </span>
            <span className="meta-divider">·</span>
            <span className="meta-item">
              <IconClock size={13} />
              <span>{readMinutes} 分钟</span>
            </span>
            <span className="meta-divider">·</span>
            <span className="meta-item">
              <IconEye size={13} />
              <span>{post.access_count || 0} 阅读</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};
