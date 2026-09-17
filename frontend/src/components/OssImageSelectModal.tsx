import React, { useState, useEffect, useCallback } from 'react';
import { api, type OssImage } from '../utils/api';

interface OssImageSelectModalProps {
  currentUrl?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const OssImageSelectModal: React.FC<OssImageSelectModalProps> = ({
  currentUrl,
  onSelect,
  onClose,
}) => {
  const [images, setImages] = useState<OssImage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const perPage = 20;

  // ESC 快捷键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadImages = useCallback((p = 1, q = '', typeFilter = selectedType) => {
    setLoading(true);
    api.adminOssGetImages({
      page: p,
      per_page: perPage,
      search: q,
      type: typeFilter || undefined,
    })
      .then(res => {
        setImages(res.images);
        setTotal(res.total);
        setPages(res.pages);
        setPage(res.page);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedType]);

  useEffect(() => {
    loadImages(1, '', selectedType);
  }, [loadImages, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    loadImages(1, searchInput, selectedType);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    // 状态更新后由 useEffect 统一响应触发，杜绝双发请求
  };

  return (
    <div className="oss-picker-modal-overlay" onClick={onClose}>
      <div className="oss-picker-modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal 头部 */}
        <div className="oss-picker-modal-header">
          <div className="oss-picker-modal-title">
            <span>选择封面配图</span>
            <span className="oss-picker-total-badge">共 {total} 张图片</span>
          </div>
          <button type="button" className="oss-picker-close-btn" onClick={onClose} title="关闭 (Esc)">
            ✕
          </button>
        </div>

        {/* 筛选与搜索工具条 */}
        <div className="oss-picker-toolbar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <div className="oss-picker-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="搜索文件名或 URL..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="oss-picker-input"
              />
              {searchInput && (
                <button
                  type="button"
                  className="oss-picker-search-clear"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    loadImages(1, '', selectedType);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
              搜索
            </button>
          </form>

          {/* 分类下拉 */}
          <select
            value={selectedType}
            onChange={e => handleTypeChange(e.target.value)}
            className="oss-picker-select"
          >
            <option value="">全部图片分类</option>
            <option value="cached">系统缓存图片</option>
            <option value="local">本地图片上传</option>
            <option value="external">外部 OSS 图片</option>
          </select>
        </div>

        {/* 图片选择网格区 */}
        <div className="oss-picker-body">
          {loading ? (
            <div className="oss-picker-loading">
              <div className="admin-loading-dot" />
              <div className="admin-loading-dot" />
              <div className="admin-loading-dot" />
            </div>
          ) : images.length === 0 ? (
            <div className="oss-picker-empty">
              <p>暂无符合条件的图片</p>
            </div>
          ) : (
            <div className="oss-picker-grid">
              {images.map(img => {
                const isCurrent = currentUrl && (img.url === currentUrl || img.url.endsWith(currentUrl));
                return (
                  <div
                    key={img.id}
                    className={`oss-picker-card ${isCurrent ? 'is-current' : ''}`}
                    onClick={() => {
                      onSelect(img.url);
                      onClose();
                    }}
                    title={`点击选择此图片作为封面: ${img.file_name || img.url}`}
                  >
                    <div className="oss-picker-thumb-wrap">
                      <img
                        src={img.url}
                        alt={img.file_name || '图片'}
                        className="oss-picker-thumb"
                        onError={e => {
                          (e.target as HTMLImageElement).style.opacity = '0.3';
                        }}
                      />
                      {isCurrent && (
                        <div className="oss-picker-current-tag">当前封面</div>
                      )}
                    </div>
                    <div className="oss-picker-info">
                      <span className="oss-picker-filename">{img.file_name || '未命名'}</span>
                      <span className="oss-picker-remark">{img.remark || img.url}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部翻页栏 */}
        {pages > 1 && (
          <div className="oss-picker-footer">
            <button
              type="button"
              className="oss-picker-page-btn"
              disabled={page <= 1}
              onClick={() => loadImages(page - 1, search, selectedType)}
            >
              ‹ 上一页
            </button>
            <span className="oss-picker-page-info">
              {page} / {pages}
            </span>
            <button
              type="button"
              className="oss-picker-page-btn"
              disabled={page >= pages}
              onClick={() => loadImages(page + 1, search, selectedType)}
            >
              下一页 ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
