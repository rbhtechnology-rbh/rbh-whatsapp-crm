import { describe, expect, it, vi } from 'vitest';
import { isAccountMediaPath, parsePrivateMediaUrl, privateMediaUrl } from './private-media';
import { mediaUrlForMeta } from './private-media-server';

describe('private media references', () => {
  it('round trips an account-scoped file without a bearer token', () => {
    const url = privateMediaUrl('chat-media', 'account-a/inbound/my file.jpg');
    expect(url).toBe('/api/private-media/chat-media/account-a/inbound/my%20file.jpg');
    expect(parsePrivateMediaUrl(url)).toEqual({ bucket: 'chat-media', path: 'account-a/inbound/my file.jpg' });
  });
  it('rejects traversal and other buckets', () => {
    expect(parsePrivateMediaUrl('/api/private-media/chat-media/account-a/%2e%2e/file')).toBeNull();
    expect(parsePrivateMediaUrl('/api/private-media/chat-media/account-a%2Fother/file')).toBeNull();
    expect(parsePrivateMediaUrl('/api/private-media/unknown/account-a/file')).toBeNull();
    expect(isAccountMediaPath('account-ab/file', 'a')).toBe(false);
  });
  it('signs only media belonging to the account', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://storage.example/signed' }, error: null });
    const db = { storage: { from: vi.fn().mockReturnValue({ createSignedUrl }) } } as never;
    const url = privateMediaUrl('flow-media', 'account-a/image.png');
    await expect(mediaUrlForMeta(db, 'b', url)).rejects.toThrow('does not belong');
    expect(createSignedUrl).not.toHaveBeenCalled();
    await expect(mediaUrlForMeta(db, 'a', url)).resolves.toBe('https://storage.example/signed');
    expect(createSignedUrl).toHaveBeenCalledWith('account-a/image.png', 600);
  });
});
