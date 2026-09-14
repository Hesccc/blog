import React, { useState } from 'react';
import { api } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';

export const AdminPassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');

    if (!oldPassword || !newPassword) {
      setPwdErr('原密码与新密码均不能为空');
      return;
    }
    if (newPassword.length < 8) {
      setPwdErr('新密码长度不能少于 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdErr('两次输入的新密码不一致');
      return;
    }

    setPwdSaving(true);
    try {
      const res = await api.changePassword({ old_password: oldPassword, new_password: newPassword });
      setPwdMsg(res.msg || '密码修改成功，请使用新密码重新登录');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwdErr((err as Error).message || '修改密码失败');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">修改密码</div>
          <div className="admin-page-subtitle">定期更换管理员密码，提升系统访问与数据安全</div>
        </div>
      </div>

      <div style={{ maxWidth: '560px' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <div className="admin-brand-icon" style={{ width: '26px', height: '26px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              安全凭证更新
            </div>
          </div>

          <div className="admin-card-body">
            {pwdMsg && (
              <div className="admin-alert admin-alert-success" style={{ marginBottom: '1.25rem' }}>
                {pwdMsg}
              </div>
            )}
            {pwdErr && (
              <div className="admin-alert admin-alert-error" style={{ marginBottom: '1.25rem' }}>
                {pwdErr}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">当前密码 *</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="admin-form-control"
                  placeholder="请输入当前正在使用的密码"
                  autoComplete="current-password"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">新密码 *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="admin-form-control"
                  placeholder="请输入新密码 (至少 8 位)"
                  autoComplete="new-password"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">确认新密码 *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="admin-form-control"
                  placeholder="再次输入新密码以确认"
                  autoComplete="new-password"
                />
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="admin-btn admin-btn-primary"
                  style={{ width: '100%', height: '40px', fontSize: '0.9rem' }}
                >
                  {pwdSaving ? '正在更新凭证...' : '确认更新密码'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
