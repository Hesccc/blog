/**
 * 清洗 Markdown 原文字符串，提取适合前台卡片展示的纯文本摘要
 * 移除图片引用 ![]()、链接语法 []()、标题标记 #、代码块、粗体等符号
 */
export function cleanMarkdownSummary(raw: string | null | undefined, maxLen = 120): string {
  if (!raw || !raw.trim()) return '';

  let text = raw.trim();

  // 1. 移除图片语法: ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');

  // 2. 简化普通链接: [title](url) -> title
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 3. 移除代码块与行内代码
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. 移除标题标志符、引用符与列表标记
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  // 5. 移除粗体、斜体、删除线
  text = text.replace(/[*_~]{1,3}/g, '');

  // 6. 移除多余换行与空格
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '...';
}
