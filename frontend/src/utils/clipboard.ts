export function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `${window.location.origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export async function copyToClipboard(text: string, onDone?: () => void): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern async clipboard API (requires secure context HTTPS or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      onDone?.();
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Reliable textarea fallback for HTTP / LAN IP (e.g. 192.168.x.x)
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';
    el.style.opacity = '0';
    document.body.appendChild(el);

    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);

    const successful = document.execCommand('copy');
    document.body.removeChild(el);

    if (successful) {
      onDone?.();
      return true;
    }
  } catch (err) {
    console.error('execCommand copy failed:', err);
  }

  return false;
}
