import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../utils/api';

interface PostCardProps {
  post: Post;
}

// A palette of gradients for thumbnail backgrounds
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #2d8ddc 0%, #23a6d5 100%)',
];

const THUMBNAIL_ICONS = ['📝', '🚀', '💡', '🔧', '📡', '🛡️', '🐳', '📊'];

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const gradientIndex = post.id % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];
  const icon = THUMBNAIL_ICONS[gradientIndex];

  const formattedDate = new Date(post.create_time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const summary =
    post.meta_description ||
    (post.content && post.content.replace(/#{1,6} /g, '').replace(/[*`_[\]()>]/g, '').trim().substring(0, 120) + '...') ||
    '';

  const wordCount = post.content ? Math.ceil(post.content.length / 2) : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300));

  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      {/* Thumbnail */}
      <div
        className={`post-card-thumbnail ${post.thumbnail && post.thumbnail.trim().length > 0 ? 'with-image' : 'no-image'}`}
        style={!(post.thumbnail && post.thumbnail.trim().length > 0) ? { background: gradient } : {}}
      >
        {post.thumbnail && post.thumbnail.trim().length > 0 ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            referrerPolicy="no-referrer"
            style={{
              height: '100%',
              width: 'auto',
              maxWidth: '300px',
              objectFit: 'cover',
              display: 'block',
              borderRadius: 'var(--border-radius)',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.classList.remove('with-image');
                parent.classList.add('no-image');
                parent.style.background = gradient;
                const emojiSpan = parent.querySelector('.fallback-emoji-span') as HTMLElement;
                if (emojiSpan) emojiSpan.style.display = 'block';
              }
            }}
          />
        ) : null}
        <span 
          className="fallback-emoji-span" 
          style={post.thumbnail && post.thumbnail.trim().length > 0 ? { display: 'none', fontSize: '3rem', userSelect: 'none' } : { fontSize: '3rem', userSelect: 'none' }}
        >
          {icon}
        </span>
      </div>

      {/* Body */}
      <div className="post-card-body">
        {/* Title */}
        <h2 className="post-card-title">{post.title}</h2>

        {/* Tags (moved up under the title, clean plain style) */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-card-tags-inline">
            <span className="tags-inline-icon">🏷️</span>
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="tag-link-simple"
                style={{ color: tag.color || 'var(--color-primary)' }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && <p className="post-card-summary">{summary}</p>}

        {/* Bottom row: Date, Category and views */}
        <div className="post-card-bottom">
          <span className="post-card-bottom-item">📅 {formattedDate}</span>
          {post.categories && post.categories.length > 0 && (
            <span className="post-card-bottom-item">
              📁 {post.categories[0].name}
            </span>
          )}
          <span className="post-card-bottom-item">
            👁️ {post.access_count}
          </span>
          <span className="post-card-bottom-item">
            ⏱️ {readMinutes} 分钟
          </span>
        </div>
      </div>
    </Link>
  );
};
