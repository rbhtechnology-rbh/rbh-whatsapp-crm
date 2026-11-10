import { NextResponse } from 'next/server';
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';
import { isAccountMediaPath } from '@/lib/storage/private-media';

export async function GET(_request: Request, context: { params: Promise<{ bucket: string; path: string[] }> }) {
  try {
    const { supabase, accountId } = await getCurrentAccount();
    const { bucket, path: parts } = await context.params;
    if (!['flow-media', 'chat-media', 'avatars'].includes(bucket) || !parts.length || parts.some(p => !p || p === '.' || p === '..' || p.includes('/') || p.includes('\\'))) {
      return new NextResponse(null, { status: 404 });
    }
    const path = parts.join('/');
    if (bucket === 'avatars') {
      const { data, error } = await supabase.from('profiles').select('user_id').eq('user_id', parts[0]).eq('account_id', accountId).maybeSingle();
      if (error || !data) return new NextResponse(null, { status: 404 });
    } else if (!isAccountMediaPath(path, accountId)) return new NextResponse(null, { status: 404 });
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(data.signedUrl, { status: 307, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
