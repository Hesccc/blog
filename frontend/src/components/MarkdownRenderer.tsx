import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      className={`code-copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  );
};

const headingIds = new Map<string, number>();

const components: Components = {
  h1: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return <h1 id={id}>{children}</h1>;
  },
  h2: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return <h2 id={id}>{children}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return <h3 id={id}>{children}</h3>;
  },
  h4: ({ children }) => {
    const text = String(children);
    const id = slugify(text);
    return <h4 id={id}>{children}</h4>;
  },
  // Code blocks with language label + copy button
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1].toUpperCase() : 'TEXT';
    const codeString = String(children).replace(/\n$/, '');

    if (className) {
      // Block code
      return (
        <div>
          <div className="code-block-header">
            <span className="code-block-lang">{lang}</span>
            <CopyButton code={codeString} />
          </div>
          <code className={className}>{children}</code>
        </div>
      );
    }

    // Inline code
    return <code className={className}>{children}</code>;
  },
  // Open links in new tab
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Reset heading id counter on each render
  headingIds.clear();
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
};
