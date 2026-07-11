import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Category, Tag } from '../utils/api';
import { AdminLayout } from '../components/AdminLayout';

interface AdminCategoriesProps {
  activeTab?: 'categories' | 'tags';
}

// Generate premium, harmonious colors with nice saturation and lightness
const getRandomBeautifulColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 15); // 70% - 85%
  const lightness = 45 + Math.floor(Math.random() * 10);  // 45% - 55%
  
  // Convert HSL to HEX
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ activeTab = 'categories' }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState(getRandomBeautifulColor());
  const [editingCatId, setEditingCatId] = useState<number | null>(null);

  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagColor, setTagColor] = useState(getRandomBeautifulColor());
  const [editingTagId, setEditingTagId] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getCategories(), api.getTags()])
      .then(([cats, tgs]) => {
        setCategories(cats);
        setTags(tgs);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      alert('分类名称和简称(slug)不能为空');
      return;
    }
    try {
      if (editingCatId) {
        await api.adminUpdateCategory(editingCatId, { name: catName, slug: catSlug, description: catDesc, color: catColor });
      } else {
        await api.adminCreateCategory({ name: catName, slug: catSlug, description: catDesc, color: catColor });
      }
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatColor(getRandomBeautifulColor());
      setEditingCatId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatColor(cat.color || getRandomBeautifulColor());
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('确定删除该分类吗？')) return;
    try {
      await api.adminDeleteCategory(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName || !tagSlug) {
      alert('标签名称和简称(slug)不能为空');
      return;
    }
    try {
      if (editingTagId) {
        await api.adminUpdateTag(editingTagId, { name: tagName, slug: tagSlug, color: tagColor });
      } else {
        await api.adminCreateTag({ name: tagName, slug: tagSlug, color: tagColor });
      }
      setTagName('');
      setTagSlug('');
      setTagColor(getRandomBeautifulColor());
      setEditingTagId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setTagName(tag.name);
    setTagSlug(tag.slug);
    setTagColor(tag.color || getRandomBeautifulColor());
  };

  const handleDeleteTag = async (id: number) => {
    if (!window.confirm('确定删除该标签吗？')) return;
    try {
      await api.adminDeleteTag(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <AdminLayout>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '2rem' }}>
        {activeTab === 'categories' ? '📁 分类管理' : '🏷️ 标签管理'}
      </h2>

      {loading ? (
        <div className="loading-wrap">
          <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>正在载入数据...</p>
        </div>
      ) : activeTab === 'categories' ? (
        /* Categories split layout */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
          {/* Category Form */}
          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>
              {editingCatId ? '📝 编辑分类' : '➕ 新建分类'}
            </h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">分类名称</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => {
                    const val = e.target.value;
                    setCatName(val);
                    setCatSlug(val.trim().toLowerCase().replace(/\s+/g, '-'));
                  }} 
                  className="admin-form-control" 
                  placeholder="如: 技术分享" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">分类描述</label>
                <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)} className="admin-form-control" placeholder="如: 分享技术文章" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>主题色彩</span>
                  <button 
                    type="button" 
                    onClick={() => setCatColor(getRandomBeautifulColor())}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
                  >
                    🎲 随机生成
                  </button>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="admin-form-control" style={{ width: '60px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <input type="text" value={catColor} onChange={e => setCatColor(e.target.value)} className="admin-form-control" placeholder="#ffffff" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontFamily: 'inherit' }}>
                  {editingCatId ? '保存' : '新建'}
                </button>
                {editingCatId && (
                  <button type="button" onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatSlug('');
                    setCatDesc('');
                    setCatColor(getRandomBeautifulColor());
                  }} className="btn btn-secondary" style={{ fontFamily: 'inherit' }}>取消</button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List Table */}
          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>已有关联分类</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>简称 (slug)</th>
                    <th>描述</th>
                    <th style={{ width: '130px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{cat.slug}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{cat.description || '无'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleEditCategory(cat)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>修改</button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tags split layout */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
          {/* Tag Form */}
          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>
              {editingTagId ? '📝 编辑标签' : '➕ 新建标签'}
            </h3>
            <form onSubmit={handleSaveTag} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">标签名称</label>
                <input 
                  type="text" 
                  value={tagName} 
                  onChange={e => {
                    const val = e.target.value;
                    setTagName(val);
                    setTagSlug(val.trim().toLowerCase().replace(/\s+/g, '-'));
                  }} 
                  className="admin-form-control" 
                  placeholder="如: Python" 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>主题色彩</span>
                  <button 
                    type="button" 
                    onClick={() => setTagColor(getRandomBeautifulColor())}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
                  >
                    🎲 随机生成
                  </button>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="color" value={tagColor} onChange={e => setTagColor(e.target.value)} className="admin-form-control" style={{ width: '60px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }} />
                  <input type="text" value={tagColor} onChange={e => setTagColor(e.target.value)} className="admin-form-control" placeholder="#ffffff" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontFamily: 'inherit' }}>
                  {editingTagId ? '保存' : '新建'}
                </button>
                {editingTagId && (
                  <button type="button" onClick={() => {
                    setEditingTagId(null);
                    setTagName('');
                    setTagSlug('');
                    setTagColor(getRandomBeautifulColor());
                  }} className="btn btn-secondary" style={{ fontFamily: 'inherit' }}>取消</button>
                )}
              </div>
            </form>
          </div>

          {/* Tags List Table */}
          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-heading)' }}>已有关联标签</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>标签</th>
                    <th>简称 (slug)</th>
                    <th style={{ width: '130px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map(tag => (
                    <tr key={tag.id}>
                      <td>
                        <span 
                          style={{ 
                            display: 'inline-block', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px', 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: tag.color, 
                            borderColor: `${tag.color}40`, 
                            background: `${tag.color}14`,
                            border: '1px solid'
                          }}
                        >
                          #{tag.name}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{tag.slug}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleEditTag(tag)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>修改</button>
                          <button onClick={() => handleDeleteTag(tag.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
