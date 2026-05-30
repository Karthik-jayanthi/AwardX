/**
 * Allow only same-origin relative paths (no protocol-relative or absolute URLs).
 */
export function sanitizeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Reject absolute URLs, protocol-relative paths, and backslash tricks.
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('\\')) return fallback;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;

  return path;
}

export function storePostAuthRedirect(raw: string | null | undefined): void {
  const safe = sanitizeRedirectPath(raw, '');
  if (safe) {
    sessionStorage.setItem('postAuthRedirect', safe);
  }
}

export function consumePostAuthRedirect(fallback = '/dashboard'): string {
  const stored = sessionStorage.getItem('postAuthRedirect');
  sessionStorage.removeItem('postAuthRedirect');
  return sanitizeRedirectPath(stored, fallback);
}
