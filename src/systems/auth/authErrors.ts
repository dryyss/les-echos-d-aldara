/**
 * Traduction en français des erreurs de Supabase Auth.
 */

export interface AuthErrorLike {
  message: string;
  code?: string;
  status?: number;
}

interface Rule {
  test: (error: AuthErrorLike) => boolean;
  message: string;
}

function matches(patterns: RegExp[], codes: string[] = []): Rule['test'] {
  return (error) =>
    (error.code !== undefined && codes.includes(error.code)) ||
    patterns.some((p) => p.test(error.message));
}

const RULES: Rule[] = [
  {
    test: matches([/password should be at least/i, /password.*too short/i], ['weak_password']),
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  },
  {
    test: matches([/already registered/i, /already been registered/i], ['user_already_exists', 'email_exists']),
    message: 'Cet email est déjà utilisé par un compte.',
  },
  {
    test: matches([/invalid login credentials/i, /invalid credentials/i], ['invalid_credentials']),
    message: 'Email ou mot de passe incorrect.',
  },
  {
    test: matches([/email not confirmed/i], ['email_not_confirmed']),
    message: 'Confirme ton adresse email (regarde ta boîte de réception) avant de te connecter.',
  },
  {
    test: matches([/unable to validate email/i, /invalid email/i, /invalid format/i], ['validation_failed']),
    message: 'Adresse email invalide.',
  },
  {
    test: matches([/anonymous sign-ins are disabled/i], ['anonymous_provider_disabled']),
    message: 'Le mode invité en ligne est désactivé. Joue en mode local ou crée un compte.',
  },
  {
    test: matches([/signups not allowed/i], ['signup_disabled']),
    message: 'Les inscriptions sont désactivées pour le moment.',
  },
  {
    test: matches([/rate limit/i, /too many requests/i], ['over_request_rate_limit', 'over_email_send_rate_limit']),
    message: 'Trop de tentatives. Réessaie dans quelques minutes.',
  },
  {
    test: matches([/failed to fetch/i, /network/i, /fetch failed/i, /load failed/i, /ECONN/]),
    message: 'Impossible de joindre le serveur. Vérifie ta connexion internet.',
  },
  {
    test: matches([/user not found/i], ['user_not_found']),
    message: 'Aucun compte ne correspond à cet email.',
  },
  {
    test: matches([/session.*missing/i, /not authenticated/i, /no user/i], ['session_not_found']),
    message: 'Tu n’es pas connecté.',
  },
];

export const GENERIC_AUTH_ERROR = 'Une erreur est survenue. Réessaie dans un instant.';

export function translateAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR;
  const rule = RULES.find((r) => r.test(error));
  return rule ? rule.message : `${GENERIC_AUTH_ERROR} (${error.message})`;
}

export function toAuthErrorLike(error: unknown): AuthErrorLike {
  if (error instanceof Error) return { message: error.message };
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    return { message: typeof message === 'string' ? message : String(message) };
  }
  return { message: String(error) };
}
