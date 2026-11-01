import { describe, expect, it } from 'vitest';
import {
  basisPointsToPercent,
  centsToEuros,
  distributeEqualAmounts,
  distributeEqualBasisPoints,
  eurosToCents,
  formatBasisPoints,
  formatDateShort,
  formatLineRecurrenceSummary,
  formatMoney,
  formatPeriodLabel,
  formatRatioPercent,
  formatSignedMoney,
  isValidPeriod,
  percentToBasisPoints,
  rebalanceSplitInputs,
  sumBasisPoints,
  toIsoDateInput,
} from './budget';

describe('utils/budget', () => {
  it('converts cents and euros accurately', () => {
    expect(centsToEuros(117000)).toBe(1170);
    expect(centsToEuros(1250)).toBe(12.5);
    expect(eurosToCents(1170)).toBe(117000);
    expect(eurosToCents(12.55)).toBe(1255);
  });

  it('formats money and signed money in French currency', () => {
    const formatted = formatMoney(117000, 'EUR');
    expect(formatted).toContain('170,00');
    expect(formatted).toContain('€');

    expect(formatSignedMoney(4250, 'EUR')).toMatch(/^\+42,50/);
    expect(formatSignedMoney(-4250, 'EUR')).toMatch(/^-42,50/);
  });

  it('converts and formats basis points', () => {
    expect(basisPointsToPercent(7000)).toBe(70);
    expect(percentToBasisPoints(70)).toBe(7000);
    expect(formatBasisPoints(7000)).toContain('70');
    expect(formatBasisPoints(3333)).toContain('33,33');
  });

  it('formats ratios and periods', () => {
    expect(formatRatioPercent(0.3435)).toContain('34,4');
    expect(formatRatioPercent(35.8)).toContain('35,8');
    expect(formatRatioPercent(null)).toBe('—');
    expect(isValidPeriod('2026-03')).toBe(true);
    expect(isValidPeriod('2026-13')).toBe(false);
    expect(formatPeriodLabel('2026-03')).toBe('Mars 2026');
  });

  it('distributes basis points and equal amounts deterministically', () => {
    const parts = distributeEqualBasisPoints(3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(sumBasisPoints(parts)).toBe(10000);

    expect(distributeEqualAmounts(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it('parses and formats ISO dates without timezone shift', () => {
    expect(toIsoDateInput('2026-08-05T02:00:00+02:00')).toBe('2026-08-05');
    expect(formatDateShort('2026-08-05T02:00:00+02:00')).toBe('05/08/2026');
  });

  it('summarizes calculated line recurrence', () => {
    expect(
      formatLineRecurrenceSummary({
        isMonthly: true,
        recurrenceType: 'interval',
        allocation: 'on_due',
        dueDay: 5,
        isVariable: false,
      })
    ).toBe('Mensuel • le 5');

    expect(
      formatLineRecurrenceSummary({
        isMonthly: false,
        recurrenceType: 'interval',
        allocation: 'smoothed',
        dueDay: null,
        isVariable: true,
      })
    ).toBe('Périodique • Lissé • Variable');

    expect(
      formatLineRecurrenceSummary({
        isMonthly: false,
        recurrenceType: 'specific_months',
        allocation: 'on_due',
        dueDay: null,
        isVariable: true,
        recurrenceParams: { months: [1, 9] },
      })
    ).toBe("Mois spécifiques (Jan., Sept.) • À l'échéance • Variable");
  });

  it('rebalances split inputs equitably for unmodified participants', () => {
    // 2 participants on 200 €: Admin = 50 € => Bae automatically receives 150 €
    const twoMembers = rebalanceSplitInputs({
      strategy: 'amount',
      totalAmountCents: 20000,
      includedIds: ['admin', 'bae'],
      currentValues: { admin: '100', bae: '100' },
      editedIds: [],
      changedMemberId: 'admin',
      newRawValue: '50',
    });
    expect(twoMembers.values).toEqual({ admin: '50', bae: '150' });
    expect(twoMembers.editedIds).toEqual(['admin']);

    // 3 participants on 200 €: Admin = 50 € => Bae & Camille each receive 75 €
    const threeMembers = rebalanceSplitInputs({
      strategy: 'amount',
      totalAmountCents: 20000,
      includedIds: ['admin', 'bae', 'camille'],
      currentValues: { admin: '66.67', bae: '66.67', camille: '66.66' },
      editedIds: [],
      changedMemberId: 'admin',
      newRawValue: '50',
    });
    expect(threeMembers.values).toEqual({
      admin: '50',
      bae: '75',
      camille: '75',
    });
    expect(threeMembers.editedIds).toEqual(['admin']);

    // Then Bae is modified to 60 € => Camille receives the remaining 90 €
    const afterSecondEdit = rebalanceSplitInputs({
      strategy: 'amount',
      totalAmountCents: 20000,
      includedIds: ['admin', 'bae', 'camille'],
      currentValues: threeMembers.values,
      editedIds: threeMembers.editedIds,
      changedMemberId: 'bae',
      newRawValue: '60',
    });
    expect(afterSecondEdit.values).toEqual({
      admin: '50',
      bae: '60',
      camille: '90',
    });
    expect(afterSecondEdit.editedIds).toEqual(['admin', 'bae']);
  });
});
