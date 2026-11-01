// src/services/apiError.ts

/** Dictionnaire { champ: message } renvoyé par `sendViolations()` côté API */
export type ApiViolations = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly violations: ApiViolations;
  /** Code métier optionnel renvoyé par l'API (ex: `email_not_verified`) */
  readonly code: string | null;

  constructor(message: string, status: number, violations: ApiViolations = {}, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.violations = violations;
    this.code = code;
  }
}

/**
 * Construit une `ApiError` à partir d'une réponse en échec de l'API Symfony.
 * Formats gérés :
 * - `{ message: string }`
 * - `{ title, violations: { champ: message }, status }`
 */
export const toApiError = (res: { status: number; data: unknown }, fallback: string): ApiError => {
  const data = res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {};

  const violations: ApiViolations = {};
  if (data.violations && typeof data.violations === 'object') {
    Object.entries(data.violations).forEach(([field, msg]) => {
      if (typeof msg === 'string') violations[field] = msg;
    });
  }

  const violationMessages = Object.values(violations);
  let message = fallback;
  if (typeof data.message === 'string' && data.message) {
    message = data.message;
  } else if (violationMessages.length > 0) {
    message = violationMessages.join(' ');
  }

  return new ApiError(message, res.status, violations, typeof data.code === 'string' ? data.code : null);
};

export const getErrorCode = (err: unknown): string | null => (err instanceof ApiError ? err.code : null);

export const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const getFieldErrors = (err: unknown): ApiViolations => (err instanceof ApiError ? err.violations : {});
