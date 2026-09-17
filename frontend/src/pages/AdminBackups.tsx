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
        </div>

        {msg && (
          <div className={`admin-alert admin-alert-${msgType}`}>
            <span>{msgType === 'success' ? '✓' : '✕'}</span>
            <span>{msg}</span>
          </div>
        )}

        {/* 快捷备份操作卡片面板 */}
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
          {/* 1. 全站数据备份 */}
          <div className="admin-card backup-action-card">
            <div className="backup-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem' }}>📦</span>
                <h3>全站数据与静态资源</h3>
              </div>
              <p>
                打包数据库全量 SQL、文章原稿、本地 uploads 静态图及系统配置文件，提供最完整的容灾快照。
              </p>
            </div>
            <div className="backup-card-actions-bottom-right">
              <button
                type="button"
                className="backup-mini-btn"
                onClick={() => handleExport('full')}
                disabled={!!operating}
              >
                {operating === 'full' ? '正在打包…' : '一键打包全站'}
              </button>
            </div>
          </div>

          {/* 2. 数据库备份与恢复 */}
          <div className="admin-card backup-action-card">
            <div className="backup-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem' }}>🗄️</span>
                <h3>数据库备份与还原</h3>
              </div>
              <p>
                导出完整 MySQL 数据库结构与所有业务表数据；同时支持直接上传外部 SQL 还原。
              </p>
            </div>
            <div className="backup-card-actions-bottom-right">
              <input
                type="file"
                ref={sqlFileRef}
                accept=".sql"
                style={{ display: 'none' }}
                onChange={handleUploadSqlRestore}
              />
              <button
                type="button"
                className="backup-mini-btn backup-mini-btn-secondary"
                onClick={() => sqlFileRef.current?.click()}
                disabled={!!operating}
                title="上传外部 SQL 文件直接恢复数据库"
              >
                {operating === 'upload_sql' ? '恢复中…' : '上传还原'}
              </button>
              <button
                type="button"
                className="backup-mini-btn"
                onClick={() => handleExport('db')}
                disabled={!!operating}
              >
                {operating === 'db' ? '导出中…' : '导出 SQL'}
              </button>
            </div>
          </div>

          {/* 3. Markdown 导出 */}
          <div className="admin-card backup-action-card">
            <div className="backup-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem' }}>📝</span>
                <h3>Markdown 文章导出</h3>
              </div>
              <p>
                将全部文章批量生成独立 .md 文件打包下载，完整保留标题、标签、分类、摘要等 YAML 头部元数据。
              </p>
            </div>
            <div className="backup-card-actions-bottom-right">
              <button
                type="button"
                className="backup-mini-btn"
                onClick={() => handleExport('markdown')}
                disabled={!!operating}
              >
                {operating === 'markdown' ? '导出中…' : '导出文章'}
              </button>
            </div>
          </div>

          {/* 4. OSS 图片库备份 */}
          <div className="admin-card backup-action-card">
            <div className="backup-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem' }}>🖼️</span>
                <h3>OSS 图片库备份</h3>
              </div>
              <p>
                打包已收录的全部图片元数据、本地 uploads 静态图片目录与 temp/images 缓存图。
              </p>
            </div>
            <div className="backup-card-actions-bottom-right">
              <button
                type="button"
                className="backup-mini-btn"
                onClick={() => handleExport('oss')}
                disabled={!!operating}
              >
                {operating === 'oss' ? '打包中…' : '导出图片库'}
              </button>
            </div>
          </div>
        </div>

        {/* 历史备份文件管理列表 */}
        <div className="admin-card backup-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--admin-text-1)', margin: 0 }}>已归档备份文件</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-3)', display: 'inline-block', marginTop: '0.25rem' }}>共 {backups.length} 个历史备份归档</span>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadBackups}>
              刷新列表
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--admin-text-3)' }}>
              正在拉取备份文件清单...
            </div>
          ) : backups.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--admin-text-3)' }}>
              暂无已生成的备份文件，请点击上方卡片创建首个备份。
            </div>
          ) : (
            <div className="admin-table-wrap" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>备份文件名</th>
                    <th>类型</th>
                    <th>文件大小</th>
                    <th>备份时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.filename}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem', fontWeight: 500 }}>
                            {b.filename}
                          </span>
                        </div>
                      </td>
                      <td>{getTypeBadge(b.type)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>{b.size_formatted}</td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-2)' }}>{b.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.6rem' }}>
                          <a
                            href={b.download_url}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            download
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
