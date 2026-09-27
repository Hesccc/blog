import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { api, type BackupFileItem } from '../utils/api';

export const AdminBackups: React.FC = () => {
  const [backups, setBackups] = useState<BackupFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const sqlFileRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 5000);
  };

  const loadBackups = () => {
    setLoading(true);
    api.adminGetBackups()
      .then(res => {
        setBackups(res.backups);
        setLoading(false);
      })
      .catch(err => {
        showMsg(err.message || '获取备份列表失败', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // 执行各类型导出
  const handleExport = async (type: 'markdown' | 'db' | 'oss' | 'full') => {
    const titles = {
      markdown: 'Markdown 文章归档',
      db: '数据库 SQL Dump',
      oss: 'OSS 图片库及本地静态资源',
      full: '全站数据与静态资源完整包',
    };
    setOperating(type);
    try {
      let res;
      if (type === 'markdown') res = await api.adminExportMarkdown();
      else if (type === 'db') res = await api.adminExportDatabase();
      else if (type === 'oss') res = await api.adminExportOss();
      else res = await api.adminExportFullSite();

      showMsg(res.msg || `${titles[type]} 导出成功！`);
      loadBackups();
    } catch (err: unknown) {
      showMsg((err as Error).message || `${titles[type]} 导出失败`, 'error');
    } finally {
      setOperating(null);
    }
  };

  // 删除备份文件
  const handleDelete = async (filename: string) => {
    if (!confirm(`确定删除备份文件「${filename}」吗？此操作不可撤销。`)) return;
    try {
      await api.adminDeleteBackup(filename);
      showMsg('备份文件已成功删除');
      setBackups(prev => prev.filter(b => b.filename !== filename));
    } catch (err: unknown) {
      showMsg((err as Error).message || '删除备份失败', 'error');
    }
  };

  // 从已有文件恢复数据库
  const handleRestoreFromFile = async (filename: string) => {
    if (!confirm(`⚠️ 危险操作警告：\n确定要将底层数据库恢复至备份「${filename}」吗？\n当前数据库内的所有表与数据将被该备份全面覆盖！`)) return;
    setOperating(`restore_${filename}`);
    try {
      const res = await api.adminRestoreDatabase(filename);
      showMsg(res.msg || '数据库恢复完成！');
    } catch (err: unknown) {
      showMsg((err as Error).message || '数据库恢复失败', 'error');
    } finally {
      setOperating(null);
    }
  };

  // 上传 SQL 文件恢复数据库
  const handleUploadSqlRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(`⚠️ 危险操作警告：\n确定要上传并执行 SQL 文件「${file.name}」吗？\n这将直接修改或覆盖现有数据库数据！`)) {
      if (sqlFileRef.current) sqlFileRef.current.value = '';
      return;
    }
    setOperating('upload_sql');
    try {
      const res = await api.adminRestoreDatabase(undefined, file);
      showMsg(res.msg || 'SQL 文件执行及数据库恢复完成！');
      loadBackups();
    } catch (err: unknown) {
      showMsg((err as Error).message || 'SQL 恢复失败', 'error');
    } finally {
      setOperating(null);
      if (sqlFileRef.current) sqlFileRef.current.value = '';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'markdown':
        return <span className="admin-badge" style={{ background: '#3b82f6', color: '#fff' }}>Markdown</span>;
      case 'database':
        return <span className="admin-badge" style={{ background: '#10b981', color: '#fff' }}>数据库 SQL</span>;
      case 'oss':
        return <span className="admin-badge" style={{ background: '#f59e0b', color: '#fff' }}>OSS/图片库</span>;
      default:
        return <span className="admin-badge" style={{ background: '#8b5cf6', color: '#fff' }}>全站备份</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="backup-page-container">
        <div className="admin-page-header">
          <div className="admin-page-header-left">
            <h1 className="admin-page-title">数据备份中心</h1>
            <p className="admin-page-desc">全站数据、Markdown 文章、OSS 图片库与底层数据库的一键备份、导出与恢复管理</p>
          </div>
          <div className="admin-page-header-right">
            <button
              type="button"
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={loadBackups}
              disabled={loading}
              title="重新检查备份目录"
            >
              🔄 刷新列表
            </button>
          </div>
        </div>

        {msg && (
          <div className={`admin-alert admin-alert-${msgType}`}>
            <span>{msgType === 'success' ? '✓' : '✕'}</span>
            <span>{msg}</span>
          </div>
        )}

        {/* 顶部统计小卡片 */}
        <div className="backup-stats-strip">
          <div className="backup-stat-card">
            <div className="backup-stat-icon backup-icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <div className="backup-stat-val">{backups.length}</div>
              <div className="backup-stat-label">历史归档总数</div>
            </div>
          </div>

          <div className="backup-stat-card">
            <div className="backup-stat-icon backup-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div>
              <div className="backup-stat-val">
                {backups.filter(b => b.type === 'database' || b.filename.endsWith('.sql')).length}
              </div>
              <div className="backup-stat-label">数据库 SQL 快照</div>
            </div>
          </div>

          <div className="backup-stat-card">
            <div className="backup-stat-icon backup-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div className="backup-stat-val">
                {backups.filter(b => b.type === 'markdown').length}
              </div>
              <div className="backup-stat-label">Markdown 文章包</div>
            </div>
          </div>

          <div className="backup-stat-card">
            <div className="backup-stat-icon backup-icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <div className="backup-stat-val">
                {backups.filter(b => b.type === 'oss').length}
              </div>
              <div className="backup-stat-label">图片与静态图库</div>
            </div>
          </div>
        </div>

        {/* 快捷备份操作卡片面板 */}
        <div className="backup-grid-cards">
          {/* 1. 全站数据备份 */}
          <div className="backup-action-card">
            <div className="backup-card-header">
              <div className="backup-card-icon-box backup-icon-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <span className="backup-pill-tag">全量容灾</span>
            </div>

            <div className="backup-card-body">
              <h3 className="backup-card-title">全站数据与静态资源</h3>
              <p className="backup-card-desc">
                一键打包数据库全量 SQL、文章原稿、本地 uploads 静态图片库及全站配置，提供完整的整机级迁移快照。
              </p>
            </div>

            <div className="backup-card-footer">
              <button
                type="button"
                className="backup-btn backup-btn-primary"
                onClick={() => handleExport('full')}
                disabled={!!operating}
              >
                {operating === 'full' ? '正在打包中…' : '一键打包全站'}
              </button>
            </div>
          </div>

          {/* 2. 数据库备份与恢复 */}
          <div className="backup-action-card">
            <div className="backup-card-header">
              <div className="backup-card-icon-box backup-icon-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <span className="backup-pill-tag">核心业务</span>
            </div>

            <div className="backup-card-body">
              <h3 className="backup-card-title">数据库备份与还原</h3>
              <p className="backup-card-desc">
                导出完整标准 MySQL 数据库结构与所有数据表，支持将导出的 SQL 脚本随时还原，或直接上传外部 SQL 执行恢复。
              </p>
            </div>

            <div className="backup-card-footer">
              <input
                type="file"
                ref={sqlFileRef}
                accept=".sql"
                style={{ display: 'none' }}
                onChange={handleUploadSqlRestore}
              />
              <button
                type="button"
                className="backup-btn backup-btn-secondary"
                onClick={() => sqlFileRef.current?.click()}
                disabled={!!operating}
                title="上传外部 SQL 文件直接恢复数据库"
              >
                {operating === 'upload_sql' ? '恢复中…' : '上传还原'}
              </button>
              <button
                type="button"
                className="backup-btn backup-btn-primary"
                onClick={() => handleExport('db')}
                disabled={!!operating}
              >
                {operating === 'db' ? '导出中…' : '导出 SQL'}
              </button>
            </div>
          </div>

          {/* 3. Markdown 导出 */}
          <div className="backup-action-card">
            <div className="backup-card-header">
              <div className="backup-card-icon-box backup-icon-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <span className="backup-pill-tag">文章原稿</span>
            </div>

            <div className="backup-card-body">
              <h3 className="backup-card-title">Markdown 文章导出</h3>
              <p className="backup-card-desc">
                将全站博文批量生成独立 .md 文件打包，保留标题、分类、标签与摘要等标准 Frontmatter 元数据，方便迁移。
              </p>
            </div>

            <div className="backup-card-footer">
              <button
                type="button"
                className="backup-btn backup-btn-primary"
                onClick={() => handleExport('markdown')}
                disabled={!!operating}
              >
                {operating === 'markdown' ? '导出中…' : '导出文章归档'}
              </button>
            </div>
          </div>

          {/* 4. OSS 图片库备份 */}
          <div className="backup-action-card">
            <div className="backup-card-header">
              <div className="backup-card-icon-box backup-icon-amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span className="backup-pill-tag">媒体资源</span>
            </div>

            <div className="backup-card-body">
              <h3 className="backup-card-title">OSS 图片库备份</h3>
              <p className="backup-card-desc">
                打包系统已收录的图床元数据、本地 uploads 静态媒体目录及缓存图片，保障文章插图与封面资产万无一失。
              </p>
            </div>

            <div className="backup-card-footer">
              <button
                type="button"
                className="backup-btn backup-btn-primary"
                onClick={() => handleExport('oss')}
                disabled={!!operating}
              >
                {operating === 'oss' ? '打包中…' : '打包图片库'}
              </button>
            </div>
          </div>
        </div>

        {/* 历史备份文件管理列表 */}
        <div className="admin-card backup-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--admin-text-1)', margin: 0 }}>已归档备份文件</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-3)', display: 'inline-block', marginTop: '0.25rem' }}>
                磁盘已留存 {backups.length} 个历史归档版本，可一键下载到本地或执行还原
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--admin-text-3)' }}>
              <div className="admin-loading-dots" style={{ marginBottom: '0.75rem' }}>
                <span className="admin-loading-dot" /><span className="admin-loading-dot" /><span className="admin-loading-dot" />
              </div>
              正在拉取备份文件清单...
            </div>
          ) : backups.length === 0 ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--admin-text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>📦</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--admin-text-2)', fontWeight: 500 }}>暂无已生成的备份文件</div>
              <p style={{ fontSize: '0.82rem', margin: '0.4rem 0 0', color: 'var(--admin-text-3)' }}>请点击上方卡片创建您的首个数据备份归档</p>
            </div>
          ) : (
            <div className="admin-table-wrap" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>备份文件名</th>
                    <th>类型</th>
                    <th>文件大小</th>
                    <th>创建时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.filename}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1rem', opacity: 0.85 }}>
                            {b.type === 'markdown' ? '📝' : (b.type === 'database' || b.filename.endsWith('.sql')) ? '🗄️' : b.type === 'oss' ? '🖼️' : '📦'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem', fontWeight: 500, color: 'var(--admin-text-1)' }}>
                            {b.filename}
                          </span>
                        </div>
                      </td>
                      <td>{getTypeBadge(b.type)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--admin-text-2)' }}>{b.size_formatted}</td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-3)' }}>{b.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <a
                            href={b.download_url}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            download
                            title="下载到本地"
                          >
                            下载
                          </a>
                          {(b.type === 'database' || b.filename.endsWith('.sql')) && (
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              onClick={() => handleRestoreFromFile(b.filename)}
                              disabled={!!operating}
                              title="从该 SQL 备份恢复数据库"
                            >
                              {operating === `restore_${b.filename}` ? '还原中…' : '恢复至此库'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleDelete(b.filename)}
                            title="永久删除此备份"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
