import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import type { Category, Tag } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const AdminPostEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(0);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [thumbnail, setThumbnail] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getTags().then(setTags).catch(console.error);

    if (isEditMode) {
      setFetching(true);
      api.adminGetPost(parseInt(id, 10))
        .then(post => {
          setTitle(post.title);
          setContent(post.content || '');
          setStatus(post.status);
          setThumbnail(post.thumbnail || '');
          if (post.categories && post.categories.length > 0) {
            setCategoryId(post.categories[0].id);
          }
          if (post.tags) {
            setSelectedTagIds(post.tags.map(t => t.id));
          }
          setFetching(false);
        })
        .catch(err => {
          setError(err.message || '加载文章数据失败');
          setFetching(false);
        });
    }
  }, [id, isEditMode]);

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title) {
      setError('标题是必填项！');
      return;
    }

    setLoading(true);
    const postData = {
      title,
      content,
      status,
      category_id: categoryId === '' ? undefined : categoryId,
      tag_ids: selectedTagIds,
      thumbnail: thumbnail.trim() || null
    };

    try {
      if (isEditMode) {
        await api.adminUpdatePost(parseInt(id, 10), postData);
      } else {
        await api.adminCreatePost(postData);
      }
      setLoading(false);
      navigate('/admin/posts');
    } catch (err: any) {
      setError(err.message || '保存文章失败');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--text-secondary)' }}>正在载入文章数据...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>
          {isEditMode ? '修改文章' : '新增文章'}
        </h2>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">文章标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文章标题"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label className="form-label">首页封面图 URL</label>
          <input
            type="text"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="请输入储存在互联网中的图片 URL 地址 (如: https://example.com/cover.png)，为空则默认展示渐变图标"
            className="form-control"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">文章分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="admin-form-control"
            >
              <option value="">-- 请选择分类 --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">发布状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(parseInt(e.target.value, 10))}
              className="admin-form-control"
            >
              <option value={0}>发布</option>
              <option value={3}>草稿</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">文章标签</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
            {tags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className="tag-badge"
                  style={{
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    backgroundColor: isSelected ? tag.color : 'transparent',
                    borderColor: tag.color,
                    color: isSelected ? '#fff' : tag.color,
                    transition: 'all 0.2s'
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">文章正文 (支持 Markdown)</label>
          <div className="editor-container">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请在这里以 Markdown 格式编写文章正文..."
              className="editor-textarea"
            />
            <div className="editor-preview">
              <MarkdownRenderer content={content || '*实时预览区，请在左侧编写文章正文...*'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/posts')}
            className="btn btn-primary"
            style={{ fontFamily: 'inherit', minWidth: '110px', justifyContent: 'center' }}
          >
            返回列表
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ fontFamily: 'inherit', minWidth: '110px', justifyContent: 'center' }}
          >
            {loading ? '正在保存...' : '保存文章'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
