/**
 * Comptes joueurs : enveloppe de Supabase Auth (email + mot de passe, Google,
 * invité anonyme) avec messages d'erreur en français. Sans Supabase, le jeu
 * utilise `AuthService.localGuest()` : un invité purement local.
 */
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { type AuthErrorLike, toAuthErrorLike, translateAuthError } from './authErrors';
import { supabase } from './supabaseClient';

export type AuthProvider = 'local' | 'email' | 'google' | 'anonymous';

export interface AuthUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  provider: AuthProvider;
}

export type AuthResult = { ok: true; user: AuthUser | null } | { ok: false; error: string };

export const LOCAL_GUEST_ID = 'local-guest';

type Result<T> = Promise<{ data: T | null; error: AuthErrorLike | null }>;

/** Vue minimale de `SupabaseClient['auth']`, pour pouvoir brancher un faux en test. */
export interface AuthApi {
  signUp(credentials: { email: string; password: string }): Result<{ user: User | null }>;
  signInWithPassword(credentials: { email: string; password: string }): Result<{ user: User | null }>;
  signInWithOAuth(credentials: {
    provider: 'google';
    options?: { redirectTo?: string };
  }): Result<{ url: string | null }>;
  signInAnonymously(): Result<{ user: User | null }>;
  updateUser(attributes: { email?: string; password?: string }): Result<{ user: User }>;
  signOut(): Promise<{ error: AuthErrorLike | null }>;
  getUser(): Result<{ user: User }>;
  onAuthStateChange(callback: (event: string, session: Session | null) => void): {
    data: { subscription: { unsubscribe(): void } };
  };
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Result<unknown>;
}

export function toAuthUser(user: User): AuthUser {
  const isAnonymous = user.is_anonymous === true;
  const rawProvider = user.app_metadata?.provider;
  let provider: AuthProvider = 'email';
  if (isAnonymous) provider = 'anonymous';
  else if (rawProvider === 'google') provider = 'google';
  return { id: user.id, email: user.email ?? null, isAnonymous, provider };
}

function redirectOrigin(): string | undefined {
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

const NOT_AVAILABLE = 'Les comptes en ligne ne sont pas configurés. Joue en invité local.';

export class AuthService {
  constructor(private readonly api: AuthApi | null) {}

  static fromClient(client: SupabaseClient | null): AuthService {
    return new AuthService(client ? (client.auth as AuthApi) : null);
  }

  /** Invité sans compte : sauvegardes locales seulement. */
  static localGuest(): AuthUser {
    return { id: LOCAL_GUEST_ID, email: null, isAnonymous: true, provider: 'local' };
  }

  /** Vrai quand Supabase est configuré (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY). */
  get isAvailable(): boolean {
    return this.api !== null;
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!this.api) return { ok: false, error: NOT_AVAILABLE };
    return this.run(() => this.api!.signUp({ email: email.trim(), password }));
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!this.api) return { ok: false, error: NOT_AVAILABLE };
    return this.run(() => this.api!.signInWithPassword({ email: email.trim(), password }));
  }

  /** Lance la redirection OAuth Google ; l'utilisateur arrive via onAuthChange au retour. */
  async signInWithGoogle(): Promise<AuthResult> {
    if (!this.api) return { ok: false, error: NOT_AVAILABLE };
    try {
      const { error } = await this.api.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectOrigin() },
      });
      if (error) return { ok: false, error: translateAuthError(error) };
      return { ok: true, user: null };
    } catch (error) {
      return { ok: false, error: translateAuthError(toAuthErrorLike(error)) };
    }
  }

  /** Invité en ligne (utilisateur anonyme Supabase) : sauvegardes synchronisées, convertible plus tard. */
  async signInAsGuest(): Promise<AuthResult> {
    if (!this.api) return { ok: true, user: AuthService.localGuest() };
    return this.run(() => this.api!.signInAnonymously());
  }

  /** Lie un email et un mot de passe au compte invité anonyme courant. */
  async upgradeGuest(email: string, password: string): Promise<AuthResult> {
    if (!this.api) return { ok: false, error: NOT_AVAILABLE };
    return this.run(() => this.api!.updateUser({ email: email.trim(), password }));
  }

  async signOut(): Promise<{ ok: boolean; error?: string }> {
    if (!this.api) return { ok: true };
    try {
      const { error } = await this.api.signOut();
      return error ? { ok: false, error: translateAuthError(error) } : { ok: true };
    } catch (error) {
      return { ok: false, error: translateAuthError(toAuthErrorLike(error)) };
    }
  }

  async getUser(): Promise<AuthUser | null> {
    if (!this.api) return null;
    try {
      const { data } = await this.api.getUser();
      return data?.user ? toAuthUser(data.user) : null;
    } catch {
      return null;
    }
  }

  /** Appelle `callback` à chaque changement de session. Renvoie la fonction de désabonnement. */
  onAuthChange(callback: (user: AuthUser | null, event: string) => void): () => void {
    if (!this.api) return () => undefined;
    const { data } = this.api.onAuthStateChange((event, session) => {
      callback(session?.user ? toAuthUser(session.user) : null, event);
    });
    return () => data.subscription.unsubscribe();
  }

  async resetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.api) return { ok: false, error: NOT_AVAILABLE };
    try {
      const { error } = await this.api.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectOrigin(),
      });
      return error ? { ok: false, error: translateAuthError(error) } : { ok: true };
    } catch (error) {
      return { ok: false, error: translateAuthError(toAuthErrorLike(error)) };
    }
  }

  private async run(call: () => Result<{ user: User | null }>): Promise<AuthResult> {
    try {
      const { data, error } = await call();
      if (error) return { ok: false, error: translateAuthError(error) };
      return { ok: true, user: data?.user ? toAuthUser(data.user) : null };
    } catch (error) {
      return { ok: false, error: translateAuthError(toAuthErrorLike(error)) };
    }
  }
}

/** Instance partagée, branchée sur le client Supabase du projet (ou local). */
export const authService = AuthService.fromClient(supabase);
