import { describe, expect, it } from 'vitest';
import { getCurrentPeriod, shiftPeriodString } from './budget.store';

describe('getCurrentPeriod', () => {
  it('formate la date au format AAAA-MM', () => {
    expect(getCurrentPeriod(new Date(2026, 0, 15))).toBe('2026-01');
    expect(getCurrentPeriod(new Date(2026, 9, 28))).toBe('2026-10');
  });
});

describe('shiftPeriodString', () => {
  it('avance et recule dans la même année', () => {
    expect(shiftPeriodString('2026-10', 1)).toBe('2026-11');
    expect(shiftPeriodString('2026-10', -1)).toBe('2026-09');
  });

  it('gère les changements d’année', () => {
    expect(shiftPeriodString('2026-12', 1)).toBe('2027-01');
    expect(shiftPeriodString('2026-01', -1)).toBe('2025-12');
    expect(shiftPeriodString('2026-10', 14)).toBe('2027-12');
  });
});
