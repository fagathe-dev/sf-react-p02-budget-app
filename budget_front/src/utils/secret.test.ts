import { describe, expect, it } from 'vitest';
import { encodeSecret } from './secret';

/** Décodage base64 -> UTF-8, équivalent de `base64_decode` côté PHP */
const decodeBase64 = (value: string): string => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

describe('encodeSecret', () => {
  it('encode une chaîne ASCII en base64', () => {
    expect(encodeSecret('password')).toBe('cGFzc3dvcmQ=');
    expect(encodeSecret('P@ss w0rd!')).toBe('UEBzcyB3MHJkIQ==');
  });

  it('retourne une chaîne vide pour une chaîne vide', () => {
    expect(encodeSecret('')).toBe('');
  });

  it('encode les caractères accentués en UTF-8', () => {
    expect(encodeSecret('é')).toBe('w6k=');
  });

  it('encode les emoji (hors Latin-1) sans lever d’erreur', () => {
    expect(() => encodeSecret('€🔒')).not.toThrow();
    expect(encodeSecret('🔒')).toBe('8J+Ukg==');
  });

  it('produit uniquement des caractères de l’alphabet base64 standard', () => {
    expect(encodeSecret('P@ss w0rd! é€🔒 ???>>>')).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it.each(['password', 'P@ss w0rd!', 'Éàçüñ', '€uro', '🔒🔑', 'a'.repeat(200), ''])(
    'est réversible : décoder le résultat redonne %p',
    (secret) => {
      expect(decodeBase64(encodeSecret(secret))).toBe(secret);
    }
  );
});
