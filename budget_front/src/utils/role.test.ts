import { describe, expect, it } from 'vitest';
import { getPrimaryRole, getRoleLabel } from './role';

describe('getPrimaryRole', () => {
  it.each([null, undefined, 'ROLE_USER' as const])('retourne ROLE_USER par défaut pour %p', (role) => {
    expect(getPrimaryRole(role)).toBe('ROLE_USER');
  });

  it('retourne ROLE_ADMIN lorsque le rôle est ROLE_ADMIN', () => {
    expect(getPrimaryRole('ROLE_ADMIN')).toBe('ROLE_ADMIN');
  });
});

describe('getRoleLabel', () => {
  it('retourne le libellé du rôle', () => {
    expect(getRoleLabel('ROLE_USER')).toBe('Utilisateur');
    expect(getRoleLabel('ROLE_ADMIN')).toBe('Administrateur');
    expect(getRoleLabel(undefined)).toBe('Utilisateur');
  });
});
