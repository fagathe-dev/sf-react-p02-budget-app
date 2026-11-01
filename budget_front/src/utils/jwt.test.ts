import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeToken, isTokenValid } from './jwt';

/** Encode une chaîne UTF-8 en segment base64url (sans padding), comme dans un vrai JWT */
const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** Construit un faux JWT : la signature n'est pas vérifiée côté frontend */
const buildToken = (payload: object): string =>
  `${toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${toBase64Url(JSON.stringify(payload))}.signature`;

describe('decodeToken', () => {
  it('décode le payload d’un JWT valide', () => {
    const payload = { userId: 'abc-123', role: 'Admin', iat: 1_700_000_000, exp: 1_700_003_600 };

    expect(decodeToken(buildToken(payload))).toEqual(payload);
  });

  it('gère les caractères base64url (- et _)', () => {
    const payload = { userId: '>>>???>>>???' };
    const token = buildToken(payload);

    // Garde-fou : le segment du payload contient bien des caractères propres au base64url
    expect(token.split('.')[1]).toMatch(/[-_]/);
    expect(decodeToken(token)).toEqual(payload);
  });

  it('gère les caractères UTF-8 (accents, €)', () => {
    const payload = { userId: 'utilisateur-é-€' };

    expect(decodeToken(buildToken(payload))).toEqual(payload);
  });

  it.each(['', 'abc', 'a.b', 'a.b.c.d'])('retourne null si le token n’a pas exactement 3 parties (%p)', (token) => {
    expect(decodeToken(token)).toBeNull();
  });

  it('retourne null si le payload n’est pas du base64 valide', () => {
    expect(decodeToken('a.%%%.c')).toBeNull();
  });

  it('retourne null si le payload n’est pas du JSON', () => {
    expect(decodeToken(`a.${toBase64Url('ceci n’est pas du json')}.c`)).toBeNull();
  });
});

describe('isTokenValid', () => {
  const NOW = new Date('2026-10-20T10:00:00Z');
  const nowInSeconds = Math.floor(NOW.getTime() / 1000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne false pour null ou une chaîne vide', () => {
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid('')).toBe(false);
  });

  it('retourne false pour un token malformé', () => {
    expect(isTokenValid('pas-un-jwt')).toBe(false);
  });

  it('retourne false si le token n’a pas de date d’expiration', () => {
    expect(isTokenValid(buildToken({ userId: 'abc' }))).toBe(false);
  });

  it('retourne false si le token est expiré', () => {
    expect(isTokenValid(buildToken({ userId: 'abc', exp: nowInSeconds - 1 }))).toBe(false);
  });

  it('retourne false si le token expire à l’instant exact', () => {
    expect(isTokenValid(buildToken({ userId: 'abc', exp: nowInSeconds }))).toBe(false);
  });

  it('retourne true si le token n’est pas encore expiré', () => {
    expect(isTokenValid(buildToken({ userId: 'abc', exp: nowInSeconds + 3600 }))).toBe(true);
  });
});
