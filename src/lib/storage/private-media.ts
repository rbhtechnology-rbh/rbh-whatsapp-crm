/** Durable references never contain a bearer token. */
const PREFIX = '/api/private-media/';
const BUCKETS = new Set(['chat-media', 'flow-media', 'avatars']);

export function privateMediaUrl(bucket: string, path: string): string {
  if (!BUCKETS.has(bucket) || !path || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Invalid private media path');
  }
  return PREFIX + [bucket, ...path.split('/')].map(encodeURIComponent).join('/');
}

export function parsePrivateMediaUrl(url: string): { bucket: string; path: string } | null {
  if (!url.startsWith(PREFIX) || url.includes('?') || url.includes('#')) return null;
  try {
    const parts = url.slice(PREFIX.length).split('/').map(decodeURIComponent);
    const bucket = parts.shift() ?? '';
    if (!BUCKETS.has(bucket) || !parts.length || parts.some((p) => !p || p === '.' || p === '..' || p.includes('/') || p.includes('\\'))) return null;
    return { bucket, path: parts.join('/') };
  } catch {
    return null;
  }
}

export function isAccountMediaPath(path: string, accountId: string): boolean {
  return path.startsWith(`account-${accountId}/`);
}
