import type { Session } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { AuthService, toAuthUser, type AuthApi } from '../../../src/systems/auth/AuthService';
import { GENERIC_AUTH_ERROR, translateAuthError } from '../../../src/systems/auth/authErrors';
import { readSupabaseConfig } from '../../../src/systems/auth/supabaseClient';
import { fakeUser } from '../fixtures';

describe('translateAuthError', () => {
  it('traduit les erreurs courantes', () => {
    expect(translateAuthError({ message: 'Password should be at least 6 characters.' })).toMatch(
      /6 caractères/,
    );
    expect(translateAuthError({ message: 'x', code: 'weak_password' })).toMatch(/6 caractères/);
    expect(translateAuthError({ message: 'User already registered' })).toMatch(/déjà utilisé/);
    expect(translateAuthError({ message: 'Invalid login credentials' })).toMatch(/incorrect/);
    expect(translateAuthError({ message: 'Email not confirmed' })).toMatch(/Confirme/);
    expect(translateAuthError({ message: 'Failed to fetch' })).toMatch(/connexion internet/);
    expect(translateAuthError({ message: 'Anonymous sign-ins are disabled' })).toMatch(/invité/);
    expect(translateAuthError({ message: 'Request rate limit reached' })).toMatch(/Trop de tentatives/);
    expect(translateAuthError({ message: 'Unable to validate email address: invalid format' })).toMatch(
      /email invalide/,
    );
  });

  it('garde le message d’origine pour les erreurs inconnues', () => {
    expect(translateAuthError({ message: 'Something odd' })).toBe(`${GENERIC_AUTH_ERROR} (Something odd)`);
    expect(translateAuthError(null)).toBe(GENERIC_AUTH_ERROR);
  });
});

describe('readSupabaseConfig', () => {
  it('exige les deux variables non vides', () => {
    expect(readSupabaseConfig({})).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: ' ', VITE_SUPABASE_ANON_KEY: 'k' })).toBeNull();
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_ANON_KEY: 'k' }),
    ).toEqual({ url: 'https://x.supabase.co', anonKey: 'k' });
  });
});

describe('toAuthUser', () => {
  it('détecte le fournisseur et les invités', () => {
    expect(toAuthUser(fakeUser())).toEqual({
      id: 'user-1',
      email: 'kael@brumeval.test',
      isAnonymous: false,
      provider: 'email',
    });
    expect(toAuthUser(fakeUser({ app_metadata: { provider: 'google' } })).provider).toBe('google');
    const guest = toAuthUser(fakeUser({ email: undefined, is_anonymous: true }));
    expect(guest).toMatchObject({ email: null, isAnonymous: true, provider: 'anonymous' });
  });
});

describe('AuthService sans Supabase', () => {
  const service = new AuthService(null);

  it('n’est pas disponible et ne propose que l’invité local', async () => {
    expect(service.isAvailable).toBe(false);
    expect(await service.signInAsGuest()).toEqual({ ok: true, user: AuthService.localGuest() });
    expect(AuthService.localGuest()).toEqual({
      id: 'local-guest',
      email: null,
      isAnonymous: true,
      provider: 'local',
    });
    const refused = await service.signIn('a@b.c', 'secret1');
    expect(refused.ok).toBe(false);
    expect(await service.getUser()).toBeNull();
    expect(await service.signOut()).toEqual({ ok: true });
    expect(typeof service.onAuthChange(() => undefined)).toBe('function');
    expect(AuthService.fromClient(null).isAvailable).toBe(false);
  });
});

function fakeApi(overrides: Partial<AuthApi> = {}): AuthApi & { unsubscribe: ReturnType<typeof vi.fn> } {
  const unsubscribe = vi.fn();
  const user = fakeUser();
  return {
    unsubscribe,
    signUp: vi.fn(async () => ({ data: { user }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { user }, error: null })),
    signInWithOAuth: vi.fn(async () => ({ data: { url: 'https://accounts.google.com' }, error: null })),
    signInAnonymously: vi.fn(async () => ({
      data: { user: fakeUser({ id: 'anon-1', email: undefined, is_anonymous: true }) },
      error: null,
    })),
    updateUser: vi.fn(async () => ({ data: { user: fakeUser({ id: 'anon-1' }) }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getUser: vi.fn(async () => ({ data: { user }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    ...overrides,
  };
}

describe('AuthService avec un faux client', () => {
  it('inscrit et connecte par email', async () => {
    const api = fakeApi();
    const service = new AuthService(api);
    expect(service.isAvailable).toBe(true);
    const result = await service.signUp(' kael@brumeval.test ', 'secret1');
    expect(result).toEqual({
      ok: true,
      user: { id: 'user-1', email: 'kael@brumeval.test', isAnonymous: false, provider: 'email' },
    });
    expect(api.signUp).toHaveBeenCalledWith({ email: 'kael@brumeval.test', password: 'secret1' });
    expect((await service.signIn('kael@brumeval.test', 'secret1')).ok).toBe(true);
  });

  it('traduit les erreurs et les exceptions réseau', async () => {
    const api = fakeApi({
      signInWithPassword: vi.fn(async () => ({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })),
      signUp: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    });
    const service = new AuthService(api);
    expect(await service.signIn('a@b.c', 'x')).toEqual({
      ok: false,
      error: 'Email ou mot de passe incorrect.',
    });
    const network = await service.signUp('a@b.c', 'x');
    expect(network.ok).toBe(false);
    if (!network.ok) expect(network.error).toMatch(/connexion internet/);
  });

  it('gère l’invité en ligne et sa conversion en compte', async () => {
    const api = fakeApi();
    const service = new AuthService(api);
    const guest = await service.signInAsGuest();
    expect(guest).toEqual({
      ok: true,
      user: { id: 'anon-1', email: null, isAnonymous: true, provider: 'anonymous' },
    });
    const upgraded = await service.upgradeGuest('nyra@foyer.test', 'secret1');
    expect(api.updateUser).toHaveBeenCalledWith({ email: 'nyra@foyer.test', password: 'secret1' });
    expect(upgraded.ok).toBe(true);
    if (upgraded.ok) expect(upgraded.user?.id).toBe('anon-1');
  });

  it('lance Google, se déconnecte, lit l’utilisateur et réinitialise le mot de passe', async () => {
    const api = fakeApi();
    const service = new AuthService(api);
    expect(await service.signInWithGoogle()).toEqual({ ok: true, user: null });
    expect(api.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
    expect((await service.getUser())?.id).toBe('user-1');
    expect(await service.resetPassword('kael@brumeval.test')).toEqual({ ok: true });
    expect(api.resetPasswordForEmail).toHaveBeenCalledWith('kael@brumeval.test', expect.anything());
    expect(await service.signOut()).toEqual({ ok: true });
    expect(api.signOut).toHaveBeenCalled();
  });

  it('relaie les changements de session et se désabonne', () => {
    const api = fakeApi();
    const service = new AuthService(api);
    const callback = vi.fn();
    const off = service.onAuthChange(callback);
    const handler = (api.onAuthStateChange as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as (
      event: string,
      session: Session | null,
    ) => void;
    handler('SIGNED_IN', { user: fakeUser() } as unknown as Session);
    handler('SIGNED_OUT', null);
    expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'user-1' }), 'SIGNED_IN');
    expect(callback).toHaveBeenNthCalledWith(2, null, 'SIGNED_OUT');
    off();
    expect(api.unsubscribe).toHaveBeenCalled();
  });
});
