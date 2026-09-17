import React, { useEffect, useRef, useState } from 'react';
import type { Post } from '../utils/api';

interface PostPosterModalProps {
  post: Post;
  siteTitle?: string;
  onClose: () => void;
}

export const PostPosterModal: React.FC<PostPosterModalProps> = ({
  post,
  siteTitle = '需要哈气的纸飞机',
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 使用原生 Canvas 绘制精美海报
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 优雅降级兼容绘制圆角矩形 (Polyfill for older iOS / Android WebView)
    const drawRoundRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number | number[]
    ) => {
      if (typeof c.roundRect === 'function') {
        c.roundRect(x, y, w, h, r);
      } else {
        const radius = typeof r === 'number' ? r : (r[0] || 0);
        c.moveTo(x + radius, y);
        c.lineTo(x + w - radius, y);
        c.quadraticCurveTo(x + w, y, x + w, y + radius);
        c.lineTo(x + w, y + h - radius);
        c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        c.lineTo(x + radius, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - radius);
        c.lineTo(x, y + radius);
        c.quadraticCurveTo(x, y, x + radius, y);
        c.closePath();
      }
    };

    // 海报固定分辨率：宽 800px，高度动态
    const width = 800;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. 绘制背景（高级深色渐变卡片质感）
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#111116');
    bgGrad.addColorStop(1, '#18181f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 装饰光晕背景
    const glow = ctx.createRadialGradient(width * 0.8, 100, 20, width * 0.8, 100, 400);
    glow.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
    glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // 边框描边
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // 2. 绘制顶部品牌胶囊
    let curY = 75;
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif';
    ctx.fillText(`●  ${siteTitle.toUpperCase()}  ·  FEATURED NOTE`, 64, curY);

    // 分类与日期
    curY += 45;
    const catName = post.categories && post.categories[0] ? post.categories[0].name : '随笔沉淀';
    const dateStr = post.create_time ? new Date(post.create_time).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) : '';

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 15px "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif';
    ctx.fillText(`${catName}   |   ${dateStr}`, 64, curY);

    // 3. 绘制文章大标题 (支持折行)
    curY += 55;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif';
    
    const maxTitleW = width - 128;
    const titleWords = post.title || '无标题文章';
    let line = '';
    const titleLines: string[] = [];

    for (let i = 0; i < titleWords.length; i++) {
      const testLine = line + titleWords[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleW && i > 0) {
        titleLines.push(line);
        line = titleWords[i];
      } else {
        line = testLine;
      }
    }
    titleLines.push(line);

    for (let l = 0; l < Math.min(titleLines.length, 3); l++) {
      ctx.fillText(titleLines[l], 64, curY);
      curY += 48;
    }

    // 分割线
    curY += 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, curY);
    ctx.lineTo(width - 64, curY);
    ctx.stroke();

    // 4. 绘制摘要引言卡片
    curY += 40;
    // 严格剥离 Markdown 符号，避免链接或代码块标记污染海报引言
    const rawSummary = post.summary || post.meta_description || post.content || '';
    const summaryText = rawSummary
      .replace(/```[\s\S]*?```/g, '')      // 剥离代码块
      .replace(/!\[.*?\]\(.*?\)/g, '')     // 剥离图片
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // 链接保留纯文本
      .replace(/<[^>]+>/g, '')             // 剥离 HTML 标签
      .replace(/[#*`~>|-]/g, '')           // 剥离 Markdown 标志
      .replace(/\s+/g, ' ')                // 压缩空白符
      .trim()
      .slice(0, 160) || '暂无摘要';
    
    // 引言外框底色
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const quoteBoxH = 260;
    ctx.beginPath();
    drawRoundRect(ctx, 64, curY, width - 128, quoteBoxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // 引言左侧强调条
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    drawRoundRect(ctx, 64, curY, 6, quoteBoxH, [12, 0, 0, 12]);
    ctx.fill();

    // 摘要文字排版
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '19px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    let sumLine = '';
    const sumLines: string[] = [];
    const maxQuoteW = width - 180;

    for (let i = 0; i < summaryText.length; i++) {
      const testLine = sumLine + summaryText[i];
      if (ctx.measureText(testLine).width > maxQuoteW && i > 0) {
        sumLines.push(sumLine);
        sumLine = summaryText[i];
      } else {
        sumLine = testLine;
      }
    }
    sumLines.push(sumLine);

    let sumY = curY + 45;
    for (let l = 0; l < Math.min(sumLines.length, 6); l++) {
      ctx.fillText(sumLines[l], 96, sumY);
      sumY += 34;
    }

    // 5. 绘制底部署名与二维码区域
    const footerY = height - 160;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(64, footerY);
    ctx.lineTo(width - 64, footerY);
    ctx.stroke();

    // 网站与作者署名
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.fillText(siteTitle, 64, footerY + 55);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText('长按识别或扫码阅读全文 · 记录技术沉淀 · 分享生活思考', 64, footerY + 90);

    // 绘制简易现代二维码占位卡片 (纯 Canvas 模拟矩阵)
    const qrSize = 80;
    const qrX = width - 64 - qrSize;
    const qrY = footerY + 28;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    drawRoundRect(ctx, qrX, qrY, qrSize, qrSize, 8);
    ctx.fill();

    // 简易二维码矩阵绘制，保证视觉真实感
    ctx.fillStyle = '#0f172a';
    // 定位角 1
    ctx.fillRect(qrX + 6, qrY + 6, 20, 20);
    ctx.clearRect(qrX + 10, qrY + 10, 12, 12);
    ctx.fillRect(qrX + 13, qrY + 13, 6, 6);
    // 定位角 2
    ctx.fillRect(qrX + qrSize - 26, qrY + 6, 20, 20);
    ctx.clearRect(qrX + qrSize - 22, qrY + 10, 12, 12);
    ctx.fillRect(qrX + qrSize - 19, qrY + 13, 6, 6);
    // 定位角 3
    ctx.fillRect(qrX + 6, qrY + qrSize - 26, 20, 20);
    ctx.clearRect(qrX + 10, qrY + qrSize - 22, 12, 12);
    ctx.fillRect(qrX + 13, qrY + qrSize - 19, 6, 6);
    // 随机杂点颗粒
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if ((r + c * 3 + post.id) % 3 === 0) {
          ctx.fillRect(qrX + 32 + c * 4, qrY + 32 + r * 4, 3, 3);
        }
      }
    }

    // 导出 DataURL
    setDataUrl(canvas.toDataURL('image/png'));
  }, [post, siteTitle]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `海报_${post.title.slice(0, 20)}.png`;
    a.click();
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="post-poster-modal-overlay" onClick={onClose}>
      <div className="post-poster-modal-content" onClick={e => e.stopPropagation()}>
        <div className="post-poster-modal-header">
          <h3>分享卡片 / 海报</h3>
          <button type="button" className="post-poster-close-btn" onClick={onClose} title="关闭 (Esc)">
            ✕
          </button>
        </div>

        <div className="post-poster-preview-wrap">
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {dataUrl ? (
            <img src={dataUrl} alt="文章分享海报" className="post-poster-preview-img" />
          ) : (
            <div style={{ padding: '3rem', color: '#94a3b8' }}>正在生成高清海报...</div>
          )}
        </div>

        <div className="post-poster-modal-footer">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleCopyImage}
          >
            {copied ? '✓ 已复制到剪贴板' : '复制海报图片'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleDownload}
          >
            下载海报 PNG
          </button>
        </div>
      </div>
    </div>
  );
};
