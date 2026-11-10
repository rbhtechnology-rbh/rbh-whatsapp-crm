import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const { getAccount, sign, profile } = vi.hoisted(() => ({ getAccount: vi.fn(), sign: vi.fn(), profile: vi.fn() }));
vi.mock('@/lib/auth/account', () => ({
  getCurrentAccount: getAccount,
  toErrorResponse: () => new Response(null, { status: 401 }),
}));

describe('private media access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example/signed' }, error: null });
    profile.mockResolvedValue({ data: null, error: null });
    getAccount.mockResolvedValue({ accountId: 'a', supabase: { storage: { from: () => ({ createSignedUrl: sign }) }, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: profile }) }) }) }) } });
  });
  const request = new Request('https://crm.example/api/private-media');
  it('denies cross-account paths before creating a signed URL', async () => {
    const result = await GET(request, { params: Promise.resolve({ bucket: 'chat-media', path: ['account-b', 'file.png'] }) });
    expect(result.status).toBe(404);
    expect(sign).not.toHaveBeenCalled();
  });
  it('only redirects an authenticated account member to a short-lived URL', async () => {
    const result = await GET(request, { params: Promise.resolve({ bucket: 'chat-media', path: ['account-a', 'file.png'] }) });
    expect(result.status).toBe(307);
    expect(result.headers.get('cache-control')).toBe('private, no-store');
    expect(sign).toHaveBeenCalledWith('account-a/file.png', 60);
  });
  it('does not sign when authentication fails', async () => {
    getAccount.mockRejectedValue(new Error('not authenticated'));
    const result = await GET(request, { params: Promise.resolve({ bucket: 'chat-media', path: ['account-a', 'file.png'] }) });
    expect(result.status).toBe(401);
    expect(sign).not.toHaveBeenCalled();
  });
  it('denies avatars for users outside the account', async () => {
    const result = await GET(request, { params: Promise.resolve({ bucket: 'avatars', path: ['other-user', 'avatar.png'] }) });
    expect(result.status).toBe(404);
    expect(sign).not.toHaveBeenCalled();
  });
  it('allows an avatar only when the profile belongs to the account', async () => {
    profile.mockResolvedValue({ data: { user_id: 'member' }, error: null });
    const result = await GET(request, { params: Promise.resolve({ bucket: 'avatars', path: ['member', 'avatar.png'] }) });
    expect(result.status).toBe(307);
    expect(sign).toHaveBeenCalledWith('member/avatar.png', 60);
  });
});
