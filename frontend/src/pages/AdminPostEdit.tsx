import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Category, Tag } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { OssImageSelectModal } from '../components/OssImageSelectModal';
import { IconArrowLeft } from '../components/Icons';
import { getDeterministicEmoji } from '../utils/emoji';

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
  const [summary, setSummary] = useState('');

  const [editorTab, setEditorTab] = useState<'split' | 'edit' | 'preview'>('split');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showOssPicker, setShowOssPicker] = useState(false);
  const [uploadingContentImg, setUploadingContentImg] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImgInputRef = useRef<HTMLInputElement>(null);

  // ── 草稿箱与自动保存状态 ──
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = `post_draft_${id || 'new'}`;

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── AI 助手交互状态 ──────────────────────────────────────────────────────────
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActionType, setAiActionType] = useState<'taxonomy' | 'summary' | 'proofread' | 'expand' | null>(null);
  const [aiSummaryResult, setAiSummaryResult] = useState('');
  const [aiProofreadResult, setAiProofreadResult] = useState<{ revised_content: string; suggestions: string[] } | null>(null);
  const [aiExpandResult, setAiExpandResult] = useState('');
  const [aiExpandPrompt, setAiExpandPrompt] = useState('结合企业生产环境，补充排查步骤与避坑实战经验');
  const [aiTaxonomyResult, setAiTaxonomyResult] = useState<{
    category: { id: number; name: string; slug: string } | null;
    tags: Array<{ id: number; name: string; slug: string }>;
  } | null>(null);

  // 检查本地暂存草稿
  const checkLocalDraft = useCallback((origTitle: string, origContent: string) => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.title !== origTitle || parsed.content !== origContent)) {
          setHasDraft(true);
        }
      }
    } catch {
      // 忽略解析异常
    }
  }, [draftKey]);

  const fetchBaseData = () => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getTags().then(setTags).catch(console.error);
  };

  useEffect(() => {
    fetchBaseData();

    if (isEditMode) {
      setFetching(true);
      api.adminGetPost(parseInt(id, 10))
        .then(post => {
          setTitle(post.title);
          setContent(post.content || '');
          setStatus(post.status);
          setThumbnail(post.thumbnail || '');
          setSummary(post.summary || post.meta_description || '');
          if (post.categories && post.categories.length > 0) {
            setCategoryId(post.categories[0].id);
          }
          if (post.tags) {
            setSelectedTagIds(post.tags.map(t => t.id));
          }
          setFetching(false);
          checkLocalDraft(post.title, post.content || '');
        })
        .catch(err => {
          setError(err.message || '加载文章数据失败');
          setFetching(false);
        });
    } else {
      checkLocalDraft('', '');
    }
  }, [id, isEditMode, checkLocalDraft]);

  // 使用 ref 实时同步表单最新值，彻底解耦定时器与频繁打字渲染
  const formDataRef = useRef({ title, content, status, categoryId, selectedTagIds, thumbnail, summary });
  useEffect(() => {
    formDataRef.current = { title, content, status, categoryId, selectedTagIds, thumbnail, summary };
  }, [title, content, status, categoryId, selectedTagIds, thumbnail, summary]);

  // 定时自动保存到草稿箱 (每 25 秒稳定触发，打字不重置定时器)
  useEffect(() => {
    if (fetching) return;
    const timer = setInterval(() => {
      const d = formDataRef.current;
      if (d.title.trim() || d.content.trim()) {
        try {
          const savedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const draftData = {
            ...d,
            savedAt,
          };
          localStorage.setItem(draftKey, JSON.stringify(draftData));
          setAutoSaveStatus(`草稿于 ${savedAt} 自动暂存`);
        } catch (storageErr) {
          // 防御 QuotaExceededError 存储配额超限
          console.warn('localStorage 自动暂存草稿受阻 (可能超出浏览器存储配额):', storageErr);
          setAutoSaveStatus('自动保存受限 (存储空间满)');
        }
      }
    }, 25000);

    return () => clearInterval(timer);
  }, [fetching, draftKey]);

  // 恢复草稿（增加严格类型校验）
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (typeof d.title === 'string') setTitle(d.title);
        if (typeof d.content === 'string') setContent(d.content);
        if (typeof d.status === 'number') setStatus(d.status);
        if (typeof d.categoryId === 'number' || d.categoryId === '') setCategoryId(d.categoryId);
        if (Array.isArray(d.selectedTagIds)) {
          setSelectedTagIds(d.selectedTagIds.filter((tid: unknown): tid is number => typeof tid === 'number'));
        }
        if (typeof d.thumbnail === 'string') setThumbnail(d.thumbnail);
        if (typeof d.summary === 'string') setSummary(d.summary);
        setHasDraft(false);
        setAutoSaveStatus(`已成功载入暂存草稿 (${d.savedAt || ''})`);
      }
    } catch {
      setError('解析本地草稿异常，草稿数据可能已损坏');
    }
  };

  // 放弃草稿
  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  };

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(tid => tid !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError('');
    try {
      const res = await api.uploadImage(file, `文章封面 - ${title || '未命名'}`);
      setThumbnail(res.url);
    } catch (err: unknown) {
      setError((err as Error).message || '封面上传失败');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleContentImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingContentImg(true);
    setError('');
    try {
      const res = await api.uploadImage(file, `文章正文插图 - ${title || '未命名'}`);
      const markdownImg = `\n![${res.file_name || '插图'}](${res.url})\n`;
      setContent(prev => prev ? `${prev}\n${markdownImg}` : markdownImg);
    } catch (err: unknown) {
      setError((err as Error).message || '正文图片上传失败');
    } finally {
      setUploadingContentImg(false);
      if (contentImgInputRef.current) contentImgInputRef.current.value = '';
    }
  };

  // ─── AI 功能触发函数 ────────────────────────────────────────────────────────
  const runAiTaxonomy = async () => {
    if (!content.trim() && !title.trim()) {
      setError('请先输入文章标题或正文内容供 AI 分析');
      return;
    }
    setAiLoading(true);
    setAiActionType('taxonomy');
    setAiPanelOpen(true);
    setError('');
    try {
      const res = await api.aiAnalyzeTaxonomy({ title, content });
      setAiTaxonomyResult(res);
      // 重新拉取一次分类标签字典（可能自动新增了）
      fetchBaseData();
    } catch (err: unknown) {
      setError((err as Error).message || 'AI 分析分类标签失败');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiSummary = async () => {
    if (!content.trim()) {
      setError('正文为空，无法提炼摘要');
      return;
    }
    setAiLoading(true);
    setAiActionType('summary');
    setAiPanelOpen(true);
    setError('');
    try {
      const res = await api.aiGenerateSummary({ title, content });
      setAiSummaryResult(res.summary);
    } catch (err: unknown) {
      setError((err as Error).message || 'AI 提炼摘要失败');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiProofread = async () => {
    if (!content.trim()) {
      setError('正文为空，无法进行文本校对');
      return;
    }
    setAiLoading(true);
    setAiActionType('proofread');
    setAiPanelOpen(true);
    setError('');
    try {
      const res = await api.aiProofread({ content });
      setAiProofreadResult(res);
    } catch (err: unknown) {
      setError((err as Error).message || 'AI 润色校对失败');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiExpand = async () => {
    if (!content.trim()) {
      setError('正文为空，无法进行扩写');
      return;
    }
    setAiLoading(true);
    setAiActionType('expand');
    setAiPanelOpen(true);
    setError('');
    try {
      const res = await api.aiExpand({ title, content, instruction: aiExpandPrompt });
      setAiExpandResult(res.expanded_content);
    } catch (err: unknown) {
      setError((err as Error).message || 'AI 内容扩写失败');
    } finally {
      setAiLoading(false);
    }
  };

  // ─── 采纳 AI 生成结果 ────────────────────────────────────────────────────────
  const applyTaxonomy = () => {
    if (!aiTaxonomyResult) return;
    if (aiTaxonomyResult.category) {
      setCategoryId(aiTaxonomyResult.category.id);
    }
    if (aiTaxonomyResult.tags && aiTaxonomyResult.tags.length > 0) {
      // 只能新增关联，不能对已有已选标签进行删除
      const newTagIds = aiTaxonomyResult.tags.map(t => t.id);
      setSelectedTagIds(prev => Array.from(new Set([...prev, ...newTagIds])));
    }
    setSuccessMsg('已采纳 AI 推荐的分类与标签！');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const applySummary = () => {
    if (!aiSummaryResult) return;
    setSummary(aiSummaryResult);
    setSuccessMsg('已采纳 AI 生成的内容摘要到文章摘要字段中！');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const applySummaryToBody = () => {
    if (!aiSummaryResult) return;
    const block = `> **文章导读**：${aiSummaryResult}\n\n`;
    setContent(prev => `${block}${prev}`);
    setSuccessMsg('已将 AI 摘要作为导读插入正文顶部！');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const applyProofread = () => {
    if (!aiProofreadResult?.revised_content) return;
    setContent(aiProofreadResult.revised_content);
    setSuccessMsg('已应用 AI 润色校对后的正文！');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const applyExpand = () => {
    if (!aiExpandResult) return;
    setContent(aiExpandResult);
    setSuccessMsg('已采纳 AI 扩写后的文章！');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('请输入文章标题');
      return;
    }

    setLoading(true);
    const postData = {
      title: title.trim(),
      content,
      status,
      category_id: categoryId === '' ? undefined : categoryId,
      tag_ids: selectedTagIds,
      thumbnail: thumbnail.trim() || null,
      summary: summary.trim() || null
    };

    try {
      if (isEditMode) {
        await api.adminUpdatePost(parseInt(id, 10), postData);
        setSuccessMsg('文章已成功保存！');
      } else {
        const created = await api.adminCreatePost(postData);
        navigate(`/admin/posts/edit/${created.id}`);
        setSuccessMsg('文章已成功创建！');
      }
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setAutoSaveStatus('内容已成功同步至服务器');
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || '保存文章失败');
      setLoading(false);
    }
  };

  const wordCount = content ? Math.ceil(content.length / 2) : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300));

  if (fetching) {
    return (
      <AdminLayout>
        <div className="admin-loading" style={{ padding: '5rem 0' }}>
          <div className="admin-loading-dots">
            <span className="admin-loading-dot" /><span className="admin-loading-dot" /><span className="admin-loading-dot" />
          </div>
          <p>正在拉取文章数据...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="post-editor-form">
        {/* Top Control Bar */}
        <div className="editor-top-bar">
          <div className="editor-top-left">
            <Link to="/admin/posts" className="editor-back-btn" title="返回文章列表">
              <IconArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="editor-page-title">{isEditMode ? '修改文章' : '写新文章'}</h1>
              <div className="editor-page-meta">
                <span>{wordCount} 字</span>
                <span>·</span>
                <span>约 {readMinutes} 分钟</span>
                {isEditMode && <span>· ID: #{id}</span>}
                {autoSaveStatus && <span style={{ color: 'var(--admin-text-3)', marginLeft: '0.5rem' }}>· {autoSaveStatus}</span>}
              </div>
            </div>
          </div>

          <div className="editor-top-actions">
            {/* AI Assistant Quick Trigger */}
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => setAiPanelOpen(v => !v)}
              style={{ color: 'var(--admin-accent)', borderColor: 'var(--admin-text-1)' }}
              title="展开 AI 智能写作侧栏"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>AI 智能创作</span>
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => navigate('/admin/posts')}
            >
              返回列表
            </button>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ minWidth: '100px' }}
            >
              {loading ? '保存中...' : (status === 0 ? '发布文章' : '保存草稿')}
            </button>
          </div>
        </div>

        {hasDraft && (
          <div className="admin-alert" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'var(--admin-text-1)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📝</span>
              <span>检测到本地存在未保存的自动暂存草稿，是否恢复？</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={handleRestoreDraft}
                style={{ padding: '0.2rem 0.65rem' }}
              >
                恢复草稿
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={handleDiscardDraft}
                style={{ padding: '0.2rem 0.65rem' }}
              >
                放弃
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="admin-alert admin-alert-error" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="admin-alert admin-alert-success" style={{ marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}

        {/* AI Assistant Drawer / Drawer Card */}
        {aiPanelOpen && (
          <div className="admin-card ai-assistant-bar">
            <div className="ai-bar-header">
              <div className="ai-bar-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>LLM 大模型智能创作助手</span>
              </div>
              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setAiPanelOpen(false)}
                title="收起助手"
              >
                ✕
              </button>
            </div>

            <div className="ai-action-buttons">
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${aiActionType === 'taxonomy' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={runAiTaxonomy}
                disabled={aiLoading}
              >
                🏷️ 提取分类与标签
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${aiActionType === 'summary' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={runAiSummary}
                disabled={aiLoading}
              >
                📋 提炼内容摘要
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${aiActionType === 'proofread' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={runAiProofread}
                disabled={aiLoading}
              >
                🔍 病句检查与排版润色
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${aiActionType === 'expand' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={runAiExpand}
                disabled={aiLoading}
              >
                ✍️ 智能内容扩写
              </button>
            </div>

            {/* AI Running Spinner */}
            {aiLoading && (
              <div className="ai-loading-box">
                <div className="loading-spinner" style={{ width: 18, height: 18 }} />
                <span>大模型正在深入分析思考中，请稍候...</span>
              </div>
            )}

            {/* AI Results Display */}
            {!aiLoading && (
              <div className="ai-result-area">
                {/* 1. Taxonomy Result */}
                {aiActionType === 'taxonomy' && aiTaxonomyResult && (
                  <div className="ai-result-card">
                    <div className="ai-result-title">推荐分类与标签：</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                      {aiTaxonomyResult.category && (
                        <span className="table-cat-pill" style={{ borderColor: 'var(--admin-accent)' }}>
                          分类: {aiTaxonomyResult.category.name}
                        </span>
                      )}
                      {aiTaxonomyResult.tags.map(t => (
                        <span key={t.id} className="table-tag-pill">#{t.name}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-3)', marginBottom: '0.75rem' }}>
                      （遵守只增不删原则：保留原有已选，并智能追加新增标签与设定分类）
                    </div>
                    <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={applyTaxonomy}>
                      ✓ 一键采纳分类与标签
                    </button>
                  </div>
                )}

                {/* 2. Summary Result */}
                {aiActionType === 'summary' && aiSummaryResult && (
                  <div className="ai-result-card">
                    <div className="ai-result-title">提炼的精简摘要 (200字以内)：</div>
                    <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--admin-text-1)', background: 'var(--admin-input-bg)', padding: '0.75rem', borderRadius: 6, margin: '0.5rem 0' }}>
                      {aiSummaryResult}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={applySummary}>
                        ✓ 填入文章摘要字段
                      </button>
                      <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={applySummaryToBody}>
                        同时插入为正文顶部导读
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Proofread Result */}
                {aiActionType === 'proofread' && aiProofreadResult && (
                  <div className="ai-result-card">
                    <div className="ai-result-title">病句与错别字校对建议：</div>
                    {aiProofreadResult.suggestions && aiProofreadResult.suggestions.length > 0 ? (
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--admin-text-2)', margin: '0.5rem 0' }}>
                        {aiProofreadResult.suggestions.map((s, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--admin-success)', margin: '0.5rem 0' }}>✓ 未发现严重病句或明显错别字，中英文空格排版良好！</p>
                    )}
                    <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={applyProofread}>
                      ✓ 替换应用校对后正文
                    </button>
                  </div>
                )}

                {/* 4. Expand Result */}
                {aiActionType === 'expand' && (
                  <div className="ai-result-card">
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-3)', display: 'block', marginBottom: '0.2rem' }}>扩写指导要求：</label>
                      <input
                        type="text"
                        value={aiExpandPrompt}
                        onChange={e => setAiExpandPrompt(e.target.value)}
                        className="admin-form-control"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    {aiExpandResult && (
                      <>
                        <div className="ai-result-title" style={{ marginTop: '0.5rem' }}>扩写内容预览：</div>
                        <div style={{ maxHeight: 180, overflowY: 'auto', background: 'var(--admin-input-bg)', padding: '0.65rem', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
                          {aiExpandResult.slice(0, 500)}...
                        </div>
                        <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={applyExpand}>
                          ✓ 替换应用扩写文本
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Two-Column Studio Layout */}
        <div className="editor-studio-grid">
          {/* Main Column: Title + Markdown Workspace */}
          <div className="editor-main-column">
            {/* Title Input */}
            <div className="editor-title-card">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="键入文章标题..."
                className="editor-title-input"
              />
            </div>

            {/* Markdown Workspace Card */}
            <div className="editor-workspace-card">
              {/* Workspace Toolbar */}
              <div className="editor-workspace-toolbar">
                <div className="editor-toolbar-left">
                  <div className="editor-tab-pill-group">
                    <button
                      type="button"
                      className={`editor-tab-pill ${editorTab === 'split' ? 'is-active' : ''}`}
                      onClick={() => setEditorTab('split')}
                    >
                      双栏对照
                    </button>
                    <button
                      type="button"
                      className={`editor-tab-pill ${editorTab === 'edit' ? 'is-active' : ''}`}
                      onClick={() => setEditorTab('edit')}
                    >
                      纯编辑
                    </button>
                    <button
                      type="button"
                      className={`editor-tab-pill ${editorTab === 'preview' ? 'is-active' : ''}`}
                      onClick={() => setEditorTab('preview')}
                    >
                      纯预览
                    </button>
                  </div>
                </div>

                <div className="editor-toolbar-right" style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="file"
                    ref={contentImgInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleContentImgUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={() => contentImgInputRef.current?.click()}
                    disabled={uploadingContentImg}
                    title="上传本地图片并自动在光标位置生成 Markdown 引用"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="11" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>{uploadingContentImg ? '上传中...' : '插入图片'}</span>
                  </button>
                </div>
              </div>

              {/* Editor Workspace Panes */}
              <div className={`editor-panes-wrap mode-${editorTab}`}>
                {(editorTab === 'split' || editorTab === 'edit') && (
                  <div className="editor-pane-edit">
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="请以 Markdown 语法开始编写正文内容...&#10;&#10;# 一级大标题&#10;## 二级小标题&#10;```python&#10;print('Hello World')&#10;```"
                      className="editor-textarea-modern"
                      spellCheck={false}
                    />
                  </div>
                )}

                {(editorTab === 'split' || editorTab === 'preview') && (
                  <div className="editor-pane-preview">
                    {content.trim() ? (
                      <MarkdownRenderer content={content} />
                    ) : (
                      <div className="editor-preview-empty">
                        <span>实时预览区域（在此处渲染最终排版样式与代码高亮）</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Metadata, Cover & Taxonomy */}
          <aside className="editor-meta-column">
            {/* Post Status & Category Card */}
            <div className="admin-card editor-meta-card">
              <div className="editor-card-heading">发布设定</div>
              <div className="editor-card-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">发布状态</label>
                  <select
                    value={status}
                    onChange={e => setStatus(parseInt(e.target.value, 10))}
                    className="admin-form-control"
                  >
                    <option value={0}>公开正式发布</option>
                    <option value={3}>草稿（前台隐藏）</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">所属专题分类</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="admin-form-control"
                  >
                    <option value="">-- 未归类 --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <label className="admin-form-label" style={{ margin: 0 }}>文章摘要 (AI 生成)</label>
                    <span style={{ fontSize: '0.7rem', color: summary.length > 200 ? 'var(--admin-danger)' : 'var(--admin-text-3)', fontFamily: 'var(--font-mono)' }}>
                      {summary.length}/200
                    </span>
                  </div>
                  <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    placeholder="AI 提炼或手动编写的摘要，展示在前台卡片与详情导读..."
                    className="admin-form-control"
                    rows={4}
                    style={{ fontSize: '0.82rem', lineHeight: 1.5, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Post Cover Card */}
            <div className="admin-card editor-meta-card">
              <div className="editor-card-heading-row">
                <div className="editor-card-heading">封面配图</div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={coverInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleCoverUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={() => setShowOssPicker(true)}
                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.74rem' }}
                    title="从当前 OSS 图片库中选择已有配图"
                  >
                    从图片库选择
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.74rem' }}
                  >
                    {uploadingCover ? '上传中...' : '上传本地图'}
                  </button>
                </div>
              </div>

              <div className="editor-card-body">
                <div className="admin-form-group">
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={e => setThumbnail(e.target.value)}
                    placeholder="输入 URL、从图片库选择或点击上传"
                    className="admin-form-control"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                {thumbnail ? (
                  <div className="editor-cover-preview-box">
                    <img
                      src={thumbnail}
                      alt="封面预览"
                      className="editor-cover-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      className="editor-cover-clear-btn"
                      onClick={() => setThumbnail('')}
                      title="清空封面"
                    >
                      清空
                    </button>
                  </div>
                ) : (
                  <div
                    className="editor-cover-empty-placeholder"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowOssPicker(true)}
                    title="点击打开 OSS 图片库选择封面"
                  >
                    <span>未配置独立封面</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>（点击从 OSS 图片库挑选配图）</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Selector Card */}
            <div className="admin-card editor-meta-card">
              <div className="editor-card-heading">标签关联</div>
              <div className="editor-card-body">
                {tags.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-3)' }}>
                    暂无标签，可前往「标签管理」创建。
                  </div>
                ) : (
                  <div className="editor-tags-chip-list">
                    {tags.map(tag => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          type="button"
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`editor-tag-chip ${isSelected ? 'is-selected' : ''}`}
                        >
                          <span style={{ fontSize: '0.78rem', marginRight: 2 }}>{getDeterministicEmoji(tag.name)}</span>
                          <span>{tag.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </form>

      {/* OSS 图片库弹出选择器 Modal */}
      {showOssPicker && (
        <OssImageSelectModal
          currentUrl={thumbnail}
          onSelect={url => setThumbnail(url)}
          onClose={() => setShowOssPicker(false)}
        />
      )}
    </AdminLayout>
  );
};
