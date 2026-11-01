import { z } from 'zod';

export const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const isoDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_PATTERN, 'La date doit être au format AAAA-MM-JJ.');

export const createExpenseGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du groupe est obligatoire.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Le code devise doit comporter 3 lettres (ex: EUR).'),
  participantsText: z.string().optional(),
});

export type CreateExpenseGroupFormValues = z.infer<
  typeof createExpenseGroupSchema
>;

export const updateExpenseGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du groupe est obligatoire.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
});

export type UpdateExpenseGroupFormValues = z.infer<
  typeof updateExpenseGroupSchema
>;

export const expenseFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Le libellé de la dépense est obligatoire.')
    .max(160, 'Le libellé ne peut pas dépasser 160 caractères.'),
  amountEuros: z
    .number({ message: 'Veuillez saisir un montant valide.' })
    .positive('Le montant doit être strictement supérieur à 0 €.'),
  spentOn: isoDateSchema,
  paidByMemberId: z
    .string()
    .trim()
    .min(1, 'Veuillez sélectionner le participant qui a payé.'),
  tagId: z.string(),
  splitStrategy: z.enum(['equals', 'percentage', 'amount']),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const settlementFormSchema = z
  .object({
    fromMemberId: z
      .string()
      .trim()
      .min(1, 'Veuillez choisir qui effectue le remboursement.'),
    toMemberId: z
      .string()
      .trim()
      .min(1, 'Veuillez choisir le bénéficiaire du remboursement.'),
    amountEuros: z
      .number({ message: 'Veuillez saisir un montant valide.' })
      .positive('Le montant doit être strictement supérieur à 0 €.'),
    settledOn: isoDateSchema,
    note: z
      .string()
      .trim()
      .max(255, 'La note ne peut pas dépasser 255 caractères.'),
  })
  .superRefine((data, ctx) => {
    if (
      data.fromMemberId &&
      data.toMemberId &&
      data.fromMemberId === data.toMemberId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['toMemberId'],
        message: 'Le bénéficiaire doit être différent de celui qui rembourse.',
      });
    }
  });

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
