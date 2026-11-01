import { describe, expect, it } from 'vitest';
import { contextValue, formatLogDate, getDeviceIcon, toPrettyText } from './logFormat';

describe('formatLogDate', () => {
  it('formate une date dd-mm-yyyy en libellé français', () => {
    expect(formatLogDate('26-10-2026')).toBe('lundi 26 octobre 2026');
  });

  it('retourne la valeur brute si le format est inattendu', () => {
    expect(formatLogDate('2026-10-26')).toBe('2026-10-26');
  });
});

describe('contextValue', () => {
  it.each(['', '   ', 'unknown', 'unknown IP address', null, undefined])('ignore la valeur %p', (value) => {
    expect(contextValue({ ip: value }, 'ip')).toBeNull();
  });

  it('retourne la valeur textuelle', () => {
    expect(contextValue({ method: 'POST' }, 'method')).toBe('POST');
  });
});

describe('getDeviceIcon', () => {
  it.each([
    ['Terminal / CLI', 'console'],
    ['Mobile', 'cellphone'],
    ['Tablet', 'tablet'],
    ['Desktop', 'monitor'],
  ])('associe %s à l’icône %s', (device, icon) => {
    expect(getDeviceIcon(device)).toBe(icon);
  });
});

describe('toPrettyText', () => {
  it('conserve les chaînes et indente les objets', () => {
    expect(toPrettyText('erreur')).toBe('erreur');
    expect(toPrettyText({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});
