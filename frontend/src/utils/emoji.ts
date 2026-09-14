/**
 * 确定性 Emoji 映射生成器
 * 核心原则：基于输入的分类/标签名称计算确定性哈希，
 * 同一个名称不论何时何地渲染，始终得到固定且唯一的专属 Emoji，
 * 绝不会像纯随机那样在用户每次刷新时乱跳。
 */

// 精选技术、工具、思考与工程向的优质 Emoji 候选池
const EMOJI_POOL = [
  '⚡', '🚀', '📦', '🛠️', '🧬', '🔮', '📡', '💡',
  '🛡️', '⚙️', '🔍', '🎯', '🧱', '🕹️', '🪐', '🌊',
  '🔥', '🌿', '🪵', '🧭', '🔖', '📐', '🔋', '💎',
  '📊', '💻', '🖥️', '🛰️', '🏷️', '📜', '🧩', '🧪'
];

// 常见技术词汇语义优先命中表
const SEMANTIC_MAP: Record<string, string> = {
  python: '🐍',
  java: '☕',
  golang: '🐹',
  go: '🐹',
  rust: '🦀',
  docker: '🐳',
  k8s: '☸️',
  kubernetes: '☸️',
  linux: '🐧',
  mysql: '🐬',
  oracle: '🏛️',
  database: '🗄️',
  db: '🗄️',
  redis: '⚡',
  security: '🛡️',
  安全: '🛡️',
  运维: '🔧',
  splunk: '📊',
  nginx: '🌐',
  react: '⚛️',
  vue: '💚',
  typescript: '📘',
  javascript: '📜',
  ai: '🤖',
  llm: '🧠',
  算法: '📐',
  网络: '📡',
  架构: '🏛️',
  git: '🌿',
  随笔: '✍️',
  默认分类: '📁',
};

export function getDeterministicEmoji(name: string | null | undefined): string {
  if (!name || !name.trim()) return '📌';
  const clean = name.trim().toLowerCase();

  // 1. 语义优先匹配
  for (const [key, emoji] of Object.entries(SEMANTIC_MAP)) {
    if (clean.includes(key)) {
      return emoji;
    }
  }

  // 2. 确定性字符累加哈希
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % EMOJI_POOL.length;
  return EMOJI_POOL[index];
}
