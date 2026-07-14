import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';

export const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('blog_config');
      return cached ? JSON.parse(cached) : {};
    } catch {}
    return {};
  });
  const [loading, setLoading] = useState(() => Object.keys(config).length === 0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getConfig()
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || '获取配置信息失败');
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');

    try {
      const updated = await api.adminUpdateConfig(config);
      setConfig(updated);
      setMsg('系统设置修改成功！');
      setSaving(false);
    } catch (err: any) {
      setError(err.message || '保存设置失败');
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '2rem' }}>系统设置</h2>

      {msg && <div className="alert alert-success">✅ {msg}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>正在载入设置数据...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div className="form-group">
            <label className="form-label">网站标题 (website_title)</label>
            <input
              type="text"
              value={config.website_title || ''}
              onChange={e => handleChange('website_title', e.target.value)}
            className="admin-form-control"
              placeholder="请输入网站标题"
            />
          </div>

          <div className="form-group">
            <label className="form-label">网站地址 (website_url)</label>
            <input
              type="text"
              value={config.website_url || ''}
              onChange={e => handleChange('website_url', e.target.value)}
            className="admin-form-control"
              placeholder="请输入网站地址"
            />
          </div>

          <div className="form-group">
            <label className="form-label">网站关键词 (website_keywords)</label>
            <input
              type="text"
              value={config.website_keywords || ''}
              onChange={e => handleChange('website_keywords', e.target.value)}
            className="admin-form-control"
              placeholder="多个关键词用分号(;)隔开"
            />
          </div>

          <div className="form-group">
            <label className="form-label">网站描述 (website_desc)</label>
            <textarea
              value={config.website_desc || ''}
              onChange={e => handleChange('website_desc', e.target.value)}
            className="admin-form-control"
              placeholder="请输入网站描述"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ICP 备案号 (website_icp)</label>
            <input
              type="text"
              value={config.website_icp || ''}
              onChange={e => handleChange('website_icp', e.target.value)}
            className="admin-form-control"
              placeholder="请输入ICP备案号"
            />
          </div>

          <div className="form-group">
            <label className="form-label">标签页图标 URL (website_icon)</label>
            <input
              type="text"
              value={config.website_icon || ''}
              onChange={e => handleChange('website_icon', e.target.value)}
              className="admin-form-control"
              placeholder="请输入标签页图标 URL，例如：/favicon.ico"
            />
          </div>

          <div className="form-group">
            <label className="form-label">首页Banner副标题 (homepage_subtitle)</label>
            <input
              type="text"
              value={config.homepage_subtitle || ''}
              onChange={e => handleChange('homepage_subtitle', e.target.value)}
              className="admin-form-control"
              placeholder="请输入首页Banner副标题，例如：记录技术 · 分享生活"
            />
          </div>

          <div className="form-group">
            <label className="form-label">“关于我”个人副标题 (about_profile_subtitle)</label>
            <input
              type="text"
              value={config.about_profile_subtitle || ''}
              onChange={e => handleChange('about_profile_subtitle', e.target.value)}
              className="admin-form-control"
              placeholder="请输入个人副标题，例如：💻 程序员 / 技术博主"
            />
          </div>

          <div className="form-group">
            <label className="form-label">“关于我”主页描述 (about_content)</label>
            <textarea
              value={config.about_content || ''}
              onChange={e => handleChange('about_content', e.target.value)}
              className="admin-form-control"
              placeholder="请输入“关于我”主页详细描述内容（支持多行文本）"
              style={{ minHeight: '150px', resize: 'vertical' }}
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem', fontFamily: 'inherit' }}>
            {saving ? '正在保存...' : '保存设置'}
          </button>
        </form>
      )}
    </AdminLayout>
  );
};
