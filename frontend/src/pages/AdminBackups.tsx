import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { BackupContent } from '../components/BackupContent';

export const AdminBackups: React.FC = () => {
  return (
    <AdminLayout>
      <div className="backup-page-container">
        <div className="admin-page-header">
          <div className="admin-page-header-left">
            <h1 className="admin-page-title">数据备份中心</h1>
            <p className="admin-page-desc">全站数据、Markdown 文章、OSS 图片库与底层数据库的一键备份、导出与恢复管理</p>
          </div>
        </div>
        <BackupContent />
      </div>
    </AdminLayout>
  );
};
