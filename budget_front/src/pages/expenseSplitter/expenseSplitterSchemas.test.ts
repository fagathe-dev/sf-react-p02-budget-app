import { describe, expect, it } from 'vitest';
import {
  createExpenseGroupSchema,
  expenseFormSchema,
  settlementFormSchema,
} from './expenseSplitterSchemas';

describe('pages/expenseSplitter/expenseSplitterSchemas', () => {
  it('validates createExpenseGroupSchema', () => {
    expect(
      createExpenseGroupSchema.safeParse({
        name: 'Vacances Biarritz',
        currency: 'EUR',
        participantsText: 'Camille, Alex',
      }).success
    ).toBe(true);

    expect(
      createExpenseGroupSchema.safeParse({
        name: '',
        currency: 'EUR',
      }).success
    ).toBe(false);
  });

  it('validates expenseFormSchema', () => {
    expect(
      expenseFormSchema.safeParse({
        label: 'Restaurant',
        amountEuros: 90,
        spentOn: '2026-08-05',
        paidByMemberId: 'member-1',
        tagId: '',
        splitStrategy: 'equals',
      }).success
    ).toBe(true);

    expect(
      expenseFormSchema.safeParse({
        label: 'Restaurant',
        amountEuros: 0,
        spentOn: '2026-08-05',
        paidByMemberId: 'member-1',
        tagId: '',
        splitStrategy: 'equals',
      }).success
    ).toBe(false);
  });

  it('rejects self-settlement in settlementFormSchema', () => {
    expect(
      settlementFormSchema.safeParse({
        fromMemberId: 'member-1',
        toMemberId: 'member-1',
        amountEuros: 50,
        settledOn: '2026-08-10',
        note: 'Virement Lydia',
      }).success
    ).toBe(false);

    expect(
      settlementFormSchema.safeParse({
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        amountEuros: 50,
        settledOn: '2026-08-10',
        note: 'Virement Lydia',
      }).success
    ).toBe(true);
  });
});
