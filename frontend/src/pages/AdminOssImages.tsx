import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { api, type OssImage, type Post } from '../utils/api';
import { copyToClipboard, toAbsoluteUrl } from '../utils/clipboard';

// ── 工具函数 ──────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

// ── 大图预览 Modal ─────────────────────────────────────────
interface PreviewModalProps {
  image: OssImage;
  onClose: () => void;
  onAssign: (image: OssImage) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ image, onClose, onAssign }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = () => {
    const fullUrl = toAbsoluteUrl(image.url);
    copyToClipboard(fullUrl, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="oss-preview-modal" onClick={onClose}>
      <div className="oss-preview-inner" onClick={e => e.stopPropagation()}>
        <img
          src={image.url}
          alt={image.file_name}
          className="oss-preview-img"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="oss-preview-info">
          <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{image.file_name || '未命名'}</div>
          <div style={{ wordBreak: 'break-all', opacity: 0.7, fontSize: '0.78rem', marginBottom: '0.75rem' }}>
            {image.url}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ padding: '0.45rem 1.1rem' }}
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制链接'}
            </button>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              style={{ padding: '0.45rem 1.1rem' }}
              onClick={() => { onAssign(image); onClose(); }}
            >
              分配给文章
            </button>
          </div>
        </div>
      </div>
      <button className="oss-preview-close" onClick={onClose} title="关闭 (Esc)">✕</button>
    </div>
  );
};

// ── 文章封面分配抽屉 ──────────────────────────────────────
interface AssignPanelProps {
  image: OssImage;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const AssignPanel: React.FC<AssignPanelProps> = ({ image, onClose, onSuccess }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    api.adminGetPosts({ per_page: 200 })
      .then((res: { posts: Post[] }) => { setPosts(res.posts); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p =>
    !search.trim() || p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (post: Post) => {
    setAssigning(post.id);
    try {
      await api.adminUpdatePost(post.id, { thumbnail: image.url });
      onSuccess(`✅ 已将图片设为「${post.title}」的封面`);
      // 更新本地列表中对应文章的 thumbnail
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, thumbnail: image.url } : p));
    } catch (e: unknown) {
      const err = e as Error;
      onSuccess(`⚠️ 操作失败：${err.message}`);
    } finally {
      setAssigning(null);
    }
  };

  const handleClearThumb = async (post: Post) => {
    setAssigning(post.id);
    try {
      await api.adminUpdatePost(post.id, { thumbnail: null });
      onSuccess(`✅ 已清空「${post.title}」的封面`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, thumbnail: null } : p));
    } catch (e: unknown) {
      const err = e as Error;
      onSuccess(`⚠️ 清空失败：${err.message}`);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="oss-assign-panel">
      <div className="oss-assign-header">
        <h3>分配文章封面</h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
        >✕</button>
      </div>
      <div className="oss-assign-body">
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>当前选中图片</div>
          <img
            src={image.url}
            alt={image.file_name}
            className="oss-assign-preview"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', wordBreak: 'break-all' }}>
            {image.file_name || image.url}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          点击文章行即可将此图设为该文章的封面：
        </div>

        <div className="oss-assign-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="搜索文章标题..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '1rem' }}>
            <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          </div>
        ) : (
          <ul className="oss-post-list">
            {filtered.length === 0 && (
              <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>暂无文章</li>
            )}
            {filtered.map(post => (
              <li key={post.id} className="oss-post-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt="" className="oss-post-item-thumb"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="oss-post-item-thumb-empty">无</div>
                  )}
                  <span className="oss-post-item-title">{post.title}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button
                    className="oss-action-btn"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    disabled={assigning === post.id}
                    onClick={() => handleAssign(post)}
                    title="设为该文章的封面"
                  >
                    {assigning === post.id ? '…' : '设为封面'}
                  </button>
                  {post.thumbnail && (
                    <button
                      className="oss-action-btn danger"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      disabled={assigning === post.id}
                      onClick={() => handleClearThumb(post)}
                      title="清空该文章的封面"
                    >
                      清空
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── 主页面 ────────────────────────────────────────────────
export const AdminOssImages: React.FC = () => {
  const [images, setImages] = useState<OssImage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [addMode, setAddMode] = useState(false);
  const [addUrls, setAddUrls] = useState('');
  const [adding, setAdding] = useState(false);

  const [uploadMode, setUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);

  const [previewImg, setPreviewImg] = useState<OssImage | null>(null);
  const [assignImg, setAssignImg] = useState<OssImage | null>(null);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>(''); // '' | 'cached' | 'local' | 'external'

  // 动态计算铺满当前屏幕每页所需的图片数量
  const calculateDefaultPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 24;
    // 侧边栏宽度约为 240px，内容内边距及间隙，卡片宽度预估 200px+16px gap
    const mainWidth = Math.max(320, window.innerWidth - 280);
    const cols = Math.max(2, Math.floor((mainWidth + 16) / (200 + 16)));
    // 头部、工具条、面包屑及分页高度占用约为 280px，每张卡片高度约 240px+16px gap
    const mainHeight = Math.max(400, window.innerHeight - 280);
    const rows = Math.max(2, Math.ceil(mainHeight / (240 + 16)));
    // 默认铺满整屏所需数量，兜底保底 24
    return Math.max(24, cols * rows);
  }, []);

  const [perPage, setPerPage] = useState<number>(calculateDefaultPerPage);

  const showMsg = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }, []);

  const loadImages = useCallback((p = 1, q = '', typeFilter = selectedType, customPerPage = perPage) => {
    setLoading(true);
    setSelectedIds(new Set());
    api.adminOssGetImages({ page: p, per_page: customPerPage, search: q, type: typeFilter || undefined })
      .then(res => {
        setImages(res.images);
        setTotal(res.total);
        setPages(res.pages);
        setPage(res.page);
        setLoading(false);
      })
      .catch(err => {
        showMsg(err.message || '获取图片库失败', 'error');
        setLoading(false);
      });
  }, [perPage, selectedType, showMsg]);

  useEffect(() => {
    loadImages(1, '', selectedType, perPage);
  }, [loadImages, selectedType, perPage]);

  // 监听窗口尺寸变化，如果用户调整了窗口大小，可自动保持铺满
  useEffect(() => {
    const handleResize = () => {
      const needed = calculateDefaultPerPage();
      setPerPage(prev => (prev < needed ? needed : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateDefaultPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    loadImages(1, searchInput, selectedType);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    // 状态更新后交由依赖 selectedType 的 useEffect 单一驱动，避免同一操作发送双重网络请求
  };

  // ── 添加 URL ──
  const handleAddUrls = async () => {
    const lines = addUrls.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      showMsg('请输入至少一个 URL', 'error');
      return;
    }
    setAdding(true);
    try {
      const res = await api.adminOssAddImages(lines);
      showMsg(res.msg);
      setAddUrls('');
      setAddMode(false);
      loadImages(1, search);
    } catch (err: unknown) {
      showMsg((err as Error).message || '添加失败', 'error');
    } finally {
      setAdding(false);
    }
  };

  // ── 本地图片文件上传 ──
  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name));
    if (files.length === 0) {
      showMsg('请选择有效的图片文件（PNG, JPG, WebP, GIF, SVG 等）', 'error');
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploadImages(files);
      showMsg(res.msg || `成功上传 ${files.length} 张图片！`);
      setUploadMode(false);
      loadImages(1, search);
    } catch (err: unknown) {
      showMsg((err as Error).message || '上传失败', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── 从文章导入 ──
  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.adminOssImportFromPosts();
      showMsg(res.msg);
      loadImages(1, search);
    } catch (err: unknown) {
      showMsg((err as Error).message || '导入失败', 'error');
    } finally {
      setImporting(false);
    }
  };

  // ── 删除单条 ──
  const handleDelete = async (img: OssImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定从图片库中移除「${img.file_name || img.url}」？\n（不会删除 OSS 源文件）`)) return;
    try {
      await api.adminOssDeleteImage(img.id);
      showMsg('已从图片库移除');
      setImages(prev => prev.filter(i => i.id !== img.id));
      setTotal(t => t - 1);
    } catch (err: unknown) {
      showMsg((err as Error).message || '删除失败', 'error');
    }
  };

  // ── 批量删除 ──
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定从图片库中批量移除 ${selectedIds.size} 张图片？\n（不会删除 OSS 源文件）`)) return;
    setBatchDeleting(true);
    try {
      await api.adminOssBatchDelete([...selectedIds]);
      showMsg(`已移除 ${selectedIds.size} 张图片`);
      loadImages(page, search);
    } catch (err: unknown) {
      showMsg((err as Error).message || '批量删除失败', 'error');
    } finally {
      setBatchDeleting(false);
    }
  };

  // ── 复制链接 ──
  const handleCopy = (img: OssImage, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = toAbsoluteUrl(img.url);
    copyToClipboard(fullUrl, () => {
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── 选中切换 ──
  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── 分页 ──
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    n => n === 1 || n === pages || Math.abs(n - page) <= 2
  );

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>OSS 图片库</h2>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={handleImport}
            disabled={importing}
            title="将所有文章的封面图链接批量导入到图片库"
          >
            {importing ? '导入中…' : '从文章导入封面链接'}
          </button>
          <button
            className="admin-btn admin-btn-primary admin-btn-sm"
            onClick={() => { setUploadMode(v => !v); setAddMode(false); }}
          >
            {uploadMode ? '✕ 取消上传' : '上传本地图片'}
          </button>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => { setAddMode(v => !v); setUploadMode(false); }}
          >
            {addMode ? '✕ 取消' : '粘贴外链 URL'}
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {msg && (
        <div className={`alert ${msgType === 'error' ? 'alert-error' : 'alert-success'}`}>
          {msg}
        </div>
      )}

      {/* 本地图片上传区域 */}
      {uploadMode && (
        <div
          className="oss-add-url-area"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px dashed var(--admin-accent)' : '2px dashed var(--admin-card-border)',
            textAlign: 'center',
            padding: '2rem 1.5rem',
            borderRadius: '12px',
            backgroundColor: dragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--admin-card-bg)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={e => {
              if (e.target.files) handleFilesUpload(e.target.files);
            }}
          />
          <div style={{ color: 'var(--admin-accent)', marginBottom: '0.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--admin-text-1)', marginBottom: '0.35rem' }}>
            {uploading ? '正在上传图片并写入索引...' : '点击选择图片文件，或直接拖拽图片到此区域'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-3)' }}>
            支持 JPG, PNG, GIF, WebP, SVG 格式，支持多文件并发。上传后自动写入图片库索引与随机封面库。
          </div>
          {uploading && (
            <div style={{ marginTop: '1rem', color: 'var(--admin-accent)', fontWeight: 600 }}>
              ⏳ 上传处理中，请稍候...
            </div>
          )}
        </div>
      )}

      {/* 添加 URL 区域 */}
      {addMode && (
        <div className="oss-add-url-area">
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
            添加 OSS 图片 URL
          </div>
          <textarea
            value={addUrls}
            onChange={e => setAddUrls(e.target.value)}
            placeholder={`粘贴一个或多个 OSS 图片 URL，每行一个，例如：\nhttps://your-bucket.oss-cn-hangzhou.aliyuncs.com/img/cover1.jpg\nhttps://your-bucket.oss-cn-hangzhou.aliyuncs.com/img/cover2.png`}
          />
          <div className="oss-add-url-hint">
            支持批量粘贴，每行一个 URL。添加后可从图片库直接分配给文章作为封面。
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={handleAddUrls}
              disabled={adding || !addUrls.trim()}
            >
              {adding ? '添加中…' : '确认添加'}
            </button>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => { setAddMode(false); setAddUrls(''); }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="oss-toolbar">
        <form onSubmit={handleSearch} style={{ display: 'contents' }}>
          <div className="oss-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="搜索文件名或 URL…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 0, lineHeight: 1 }}
                onClick={() => { setSearchInput(''); setSearch(''); loadImages(1, '', selectedType); }}
              >✕</button>
            )}
          </div>
          <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">搜索</button>
        </form>

        {/* 图片分类筛选框 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <select
            value={selectedType}
            onChange={e => handleTypeChange(e.target.value)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--admin-card-border)',
              backgroundColor: 'var(--admin-card-bg)',
              color: 'var(--admin-text-1)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="">全部图片分类</option>
            <option value="cached">系统缓存图片</option>
            <option value="local">本地图片上传</option>
            <option value="external">外部 OSS 图片</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--admin-text-3)' }}>
          <span>每页显示:</span>
          <select
            value={perPage}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              setPerPage(val);
              loadImages(1, search, selectedType, val);
            }}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--admin-card-border)',
              backgroundColor: 'var(--admin-card-bg)',
              color: 'var(--admin-text-1)',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={calculateDefaultPerPage()}>{`铺满整屏 (${calculateDefaultPerPage()} 张)`}</option>
            <option value={24}>24 张</option>
            <option value={48}>48 张</option>
            <option value={60}>60 张</option>
            <option value={100}>100 张</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <button
            className="admin-btn admin-btn-danger admin-btn-sm"
            onClick={handleBatchDelete}
            disabled={batchDeleting}
          >
            {batchDeleting ? '删除中…' : `批量移除 (${selectedIds.size})`}
          </button>
        )}
      </div>

      {/* 统计栏 */}
      {!loading && (
        <div className="oss-stats-bar">
          <span>共 <strong>{total}</strong> 张图片</span>
          {selectedType === 'cached' && <span>· 当前分类：<strong>系统缓存图片</strong></span>}
          {selectedType === 'local' && <span>· 当前分类：<strong>本地图片上传</strong></span>}
          {selectedType === 'external' && <span>· 当前分类：<strong>外部 OSS 图片</strong></span>}
          {search && <span>· 搜索关键词：<strong>"{search}"</strong></span>}
          {selectedIds.size > 0 && <span>· 已选 <strong>{selectedIds.size}</strong> 张</span>}
        </div>
      )}

      {/* 图片网格 */}
      {loading ? (
        <div className="loading-wrap">
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          <p style={{ marginTop: '1rem' }}>正在加载图片库…</p>
        </div>
      ) : images.length === 0 ? (
        <div className="oss-empty-state">
          <div className="oss-empty-icon" style={{ opacity: 0.3 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>图片库为空</div>
          <div style={{ fontSize: '0.85rem' }}>
            {search
              ? '未找到匹配的图片，请尝试其他关键词'
              : '点击右上角「添加图片 URL」手动录入，或点击「从文章导入封面链接」快速初始化'}
          </div>
        </div>
      ) : (
        <div className="oss-image-grid">
          {images.map(img => (
            <div
              key={img.id}
              className={`oss-image-card ${selectedIds.has(img.id) ? 'selected' : ''}`}
              onClick={() => setPreviewImg(img)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setPreviewImg(img); }}
              aria-label={`预览图片: ${img.file_name || img.url}`}
            >
              {/* 选中 checkbox */}
              <div
                className={`oss-select-checkbox ${selectedIds.has(img.id) ? 'checked' : ''}`}
                onClick={e => toggleSelect(img.id, e)}
                role="checkbox"
                aria-checked={selectedIds.has(img.id)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === ' ') toggleSelect(img.id, e as unknown as React.MouseEvent); }}
              >
                {selectedIds.has(img.id) && '✓'}
              </div>

              {/* 图片缩略图 */}
              <img
                src={img.url}
                alt={img.file_name}
                className="oss-image-thumb"
                loading="lazy"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.oss-image-thumb-placeholder')) {
                    const ph = document.createElement('div');
                    ph.className = 'oss-image-thumb-placeholder';
                    ph.textContent = 'IMG';
                    parent.insertBefore(ph, target.nextSibling);
                  }
                }}
              />

              {/* 图片信息 */}
              <div className="oss-image-info">
                <div className="oss-image-name" title={img.file_name || img.url}>
                  {img.file_name || '未命名'}
                </div>
                <div className="oss-image-meta">
                  {formatDate(img.create_time)}
                  {img.remark && <> · {img.remark}</>}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="oss-image-actions">
                <button
                  className="oss-action-btn"
                  onClick={e => handleCopy(img, e)}
                  title="复制图片 URL"
                >
                  {copiedId === img.id ? '已复制' : '复制'}
                </button>
                <button
                  className="oss-action-btn"
                  onClick={e => { e.stopPropagation(); setAssignImg(img); }}
                  title="分配给文章"
                >
                  分配
                </button>
                <button
                  className="oss-action-btn danger"
                  onClick={e => handleDelete(img, e)}
                  title="从图片库移除"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pages > 1 && (
        <div className="oss-pagination">
          <button disabled={page <= 1} onClick={() => { loadImages(page - 1, search); }}>‹ 上一页</button>
          {pageNums.map((n, i) => {
            const prev = pageNums[i - 1];
            return (
              <React.Fragment key={n}>
                {prev && n - prev > 1 && <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>}
                <button className={n === page ? 'active' : ''} onClick={() => { loadImages(n, search); }}>
                  {n}
                </button>
              </React.Fragment>
            );
          })}
          <button disabled={page >= pages} onClick={() => { loadImages(page + 1, search); }}>下一页 ›</button>
        </div>
      )}

      {/* 大图预览 Modal */}
      {previewImg && (
        <PreviewModal
          image={previewImg}
          onClose={() => setPreviewImg(null)}
          onAssign={img => { setAssignImg(img); }}
        />
      )}

      {/* 文章分配抽屉 */}
      {assignImg && (
        <AssignPanel
          image={assignImg}
          onClose={() => setAssignImg(null)}
          onSuccess={m => showMsg(m)}
        />
      )}
    </AdminLayout>
  );
};
