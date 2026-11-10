import type { SupabaseClient } from '@supabase/supabase-js';
import { isAccountMediaPath, parsePrivateMediaUrl } from './private-media';

/** Resolve an account-owned reference to a short-lived link for Meta. */
export async function mediaUrlForMeta(db: SupabaseClient, accountId: string, url: string): Promise<string> {
  const ref = parsePrivateMediaUrl(url);
  if (!ref) {
    if (url.startsWith('/api/private-media/')) throw new Error('Invalid private media reference');
    return url;
  }
  if (ref.bucket === 'avatars') throw new Error('Profile avatars cannot be sent as CRM media');
  if (!isAccountMediaPath(ref.path, accountId)) throw new Error('Media does not belong to this account');
  const { data, error } = await db.storage.from(ref.bucket).createSignedUrl(ref.path, 600);
  if (error || !data?.signedUrl) throw new Error('Unable to access private media');
  return data.signedUrl;
}
