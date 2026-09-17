import React, { useEffect, useState } from 'react';
import { IconArrowUp, IconArrowDown } from './Icons';

export const ScrollNav: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <nav
      className={`side-scroll-nav ${visible ? 'visible' : ''}`}
      aria-label="页面滚动导航"
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="side-scroll-btn"
        onClick={scrollToTop}
        title="回到顶部"
        aria-label="回到顶部"
      >
        <IconArrowUp size={18} />
      </button>
      <button
        type="button"
        className="side-scroll-btn"
        onClick={scrollToBottom}
        title="滚至底部"
        aria-label="滚至底部"
      >
        <IconArrowDown size={18} />
      </button>
    </nav>
  );
};
