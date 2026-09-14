import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface PageHeroBannerProps {
  tag: string;
  tagIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badgeContent?: React.ReactNode;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  tag,
  tagIcon,
  title,
  subtitle,
  badgeContent,
}) => {
  const [homepageBg, setHomepageBg] = useState(() => {
    try {
      const cached = localStorage.getItem('blog_config');
      if (cached) return JSON.parse(cached).homepage_bg || '';
    } catch {}
    return '';
  });

  useEffect(() => {
    api.getConfig().then(cfg => {
      if (cfg && cfg.homepage_bg !== undefined) {
        setHomepageBg(cfg.homepage_bg || '');
      }
    }).catch(console.error);
  }, []);

  return (
    <header
      className={`page-hero-banner ${homepageBg ? 'with-custom-bg' : ''}`}
      style={homepageBg ? { backgroundImage: `url("${homepageBg}")` } : undefined}
    >
      {homepageBg && <div className="page-hero-bg-overlay" />}
      {homepageBg && <div className="page-hero-feather-fade" />}

      <div className="page-hero-inner">
        <div className="page-hero-badge">
          {tagIcon && <span className="badge-icon">{tagIcon}</span>}
          <span>{tag}</span>
        </div>
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        {badgeContent}
      </div>
    </header>
  );
};
