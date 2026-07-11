import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import type { Post } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';

export const AdminPosts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [pages, setPages] = useState(1);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const fetchPosts = () => {
    setLoading(true);
    api.adminGetPosts({ page, per_page: 10, search })
      .then(data => {
        setPosts(data.posts);
        setPages(data.pages);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '获取文章列表失败');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认要删除这篇文章吗？')) return;
    try {
      await api.adminDeletePost(id);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleToggleStatus = async (post: Post) => {
    const newStatus = post.status === 0 ? 3 : 0;
    try {
      await api.adminUpdatePost(post.id, { status: newStatus });
      fetchPosts();
    } catch (err: any) {
      alert(err.message || '更改状态失败');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;
    
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>文章管理</h2>
        <Link to="/admin/posts/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          ➕ 新增文章
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="按标题搜索文章..."
          className="form-control"
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </form>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>数据加载中...</p>
      ) : error ? (
        <p style={{ color: '#ef4444' }}>{error}</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>暂无文章记录。</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>作者</th>
                  <th>分类</th>
                  <th>标签</th>
                  <th>阅读次数</th>
                  <th>状态</th>
                  <th>发布时间</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => {
                  const date = new Date(post.create_time).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  return (
                    <tr key={post.id}>
                      <td style={{ fontWeight: 600 }}>{post.title}</td>
                      <td>{post.author}</td>
                      <td>
                        {post.categories && post.categories.map(c => (
                          <span 
                            key={c.id} 
                            style={{ 
                              display: 'inline-block', 
                              padding: '0.2rem 0.65rem', 
                              borderRadius: '20px', 
                              fontSize: '0.82rem', 
                              fontWeight: 600, 
                              color: c.color || 'var(--color-primary)',
                              backgroundColor: c.color ? `${c.color}14` : 'var(--color-primary-light)',
                              border: `1px solid ${c.color ? `${c.color}40` : 'rgba(45, 141, 220, 0.15)'}`,
                              marginRight: '6px'
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </td>
                      <td>
                        {post.tags && post.tags.map(t => (
                          <span 
                            key={t.id} 
                            style={{ 
                              display: 'inline-block', 
                              padding: '0.2rem 0.65rem', 
                              borderRadius: '20px', 
                              fontSize: '0.82rem', 
                              fontWeight: 600, 
                              color: t.color || 'var(--color-primary)',
                              backgroundColor: t.color ? `${t.color}14` : 'var(--color-primary-light)',
                              border: `1px solid ${t.color ? `${t.color}40` : 'rgba(45, 141, 220, 0.15)'}`,
                              marginRight: '6px'
                            }}
                          >
                            #{t.name}
                          </span>
                        ))}
                      </td>
                      <td>{post.access_count}</td>
                      <td>
                        <button 
                          onClick={() => handleToggleStatus(post)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: post.status === 0 ? '#10b981' : 'var(--text-muted)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            fontFamily: 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0'
                          }}
                        >
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: post.status === 0 ? '#10b981' : '#f59e0b',
                            display: 'inline-block'
                          }} />
                          {post.status === 0 ? '已发布' : '草稿'}
                        </button>
                      </td>
                      <td>{date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link to={`/admin/posts/edit/${post.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                            修改
                          </Link>
                          <button onClick={() => handleDelete(post.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontFamily: 'inherit' }}>
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                上一页
              </button>
              <span className="pagination-info">第 {page} 页 / 共 {pages} 页</span>
              <button 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page === pages}
                className="btn btn-secondary"
                style={{ opacity: page === pages ? 0.5 : 1, cursor: page === pages ? 'not-allowed' : 'pointer' }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};
