import { describe, expect, it } from 'vitest';
import { identifierSchema, loginCodeSchema, passwordSchema } from './authSchemas';

describe('passwordSchema', () => {
  it('accepte un mot de passe conforme aux règles de l’API', () => {
    expect(passwordSchema.safeParse('Password123').success).toBe(true);
  });

  it.each(['Pass1', 'password123', 'PASSWORD123', 'Password'])('refuse %s', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe('identifierSchema', () => {
  it.each(['john@example.com', 'johndoe', '  jdo  '])('accepte %s', (value) => {
    expect(identifierSchema.safeParse(value).success).toBe(true);
  });

  it.each(['', '  ', 'jo'])('refuse %p', (value) => {
    expect(identifierSchema.safeParse(value).success).toBe(false);
  });
});

describe('loginCodeSchema', () => {
  it('accepte un code à 6 chiffres (espaces ignorés)', () => {
    expect(loginCodeSchema.safeParse(' 123456 ').success).toBe(true);
  });

  it.each(['12345', '1234567', '12a456', ''])('refuse %p', (value) => {
    expect(loginCodeSchema.safeParse(value).success).toBe(false);
  });
});
