export function updateFavicon(iconUrl: string | null | undefined) {
  if (!iconUrl || !iconUrl.trim()) return;

  const url = iconUrl.trim();
  // 查找所有现有的 link[rel*='icon']
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  if (existingLinks.length > 0) {
    existingLinks.forEach(link => {
      (link as HTMLLinkElement).href = url;
    });
  } else {
    const link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}
