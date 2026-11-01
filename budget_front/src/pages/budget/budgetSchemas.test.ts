import { describe, expect, it } from 'vitest';
import {
  adjustmentFormSchema,
  budgetItemFormSchema,
  createBoardSchema,
  inviteMemberSchema,
  tagFormSchema,
} from './budgetSchemas';

describe('pages/budget/budgetSchemas', () => {
  it('validates createBoardSchema', () => {
    expect(
      createBoardSchema.safeParse({
        name: 'Foyer Alice & Bob',
        type: 'shared',
        currency: 'EUR',
        guestsText: 'Bob',
      }).success
    ).toBe(true);

    expect(
      createBoardSchema.safeParse({
        name: '',
        type: 'shared',
        currency: 'EUR',
      }).success
    ).toBe(false);
  });

  it('validates budgetItemFormSchema with specific_months and endPeriod rules', () => {
    expect(
      budgetItemFormSchema.safeParse({
        kind: 'expense',
        label: 'Taxe foncière',
        amountEuros: 1200,
        recurrenceType: 'specific_months',
        intervalMonths: 1,
        specificMonths: [],
        isVariable: false,
        allocation: 'smoothed',
        effectiveFrom: '2026-01',
        endPeriod: '',
        dueDay: '15',
        paidByMemberId: '',
        splitStrategy: 'default',
      }).success
    ).toBe(false);

    expect(
      budgetItemFormSchema.safeParse({
        kind: 'expense',
        label: 'Taxe foncière',
        amountEuros: 1200,
        recurrenceType: 'specific_months',
        intervalMonths: 1,
        specificMonths: [10],
        isVariable: false,
        allocation: 'smoothed',
        effectiveFrom: '2026-01',
        endPeriod: '2026-12',
        dueDay: '15',
        paidByMemberId: '',
        splitStrategy: 'default',
      }).success
    ).toBe(true);
  });

  it('validates adjustmentFormSchema when type is amount', () => {
    expect(
      adjustmentFormSchema.safeParse({
        type: 'amount',
        amountEuros: '',
        note: '',
      }).success
    ).toBe(false);

    expect(
      adjustmentFormSchema.safeParse({
        type: 'amount',
        amountEuros: '124.50',
        note: 'Régularisation annuelle',
      }).success
    ).toBe(true);
  });

  it('validates inviteMemberSchema email requirement on email channel', () => {
    expect(
      inviteMemberSchema.safeParse({
        channel: 'email',
        email: '',
        displayName: 'Bob',
        memberId: '',
        maxUses: 1,
        ttlDays: 7,
      }).success
    ).toBe(false);

    expect(
      inviteMemberSchema.safeParse({
        channel: 'link',
        email: '',
        displayName: 'Bob',
        memberId: '',
        maxUses: 5,
        ttlDays: 7,
      }).success
    ).toBe(true);
  });

  it('validates tagFormSchema', () => {
    expect(
      tagFormSchema.safeParse({
        name: 'Logement',
        color: 'blue',
      }).success
    ).toBe(true);
  });
});
