import { z } from 'zod';

export const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const periodSchema = z
  .string()
  .trim()
  .regex(PERIOD_PATTERN, 'La période doit être au format AAAA-MM.');

export const optionalPeriodSchema = z
  .string()
  .trim()
  .refine((val) => val === '' || PERIOD_PATTERN.test(val), {
    message: 'La période doit être au format AAAA-MM.',
  });

export const tagColorValues = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
  'gray',
] as const;

export const createBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du budget est obligatoire.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  type: z.enum(['personal', 'shared']),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Le code devise doit comporter 3 lettres (ex: EUR).'),
  guestsText: z.string().optional(),
});

export type CreateBoardFormValues = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du budget est obligatoire.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  rollupDisplay: z.enum(['grouped', 'detailed']),
});

export type UpdateBoardFormValues = z.infer<typeof updateBoardSchema>;

export const budgetItemFormSchema = z
  .object({
    kind: z.enum(['income', 'expense', 'savings']),
    label: z
      .string()
      .trim()
      .min(1, 'Le libellé du poste est obligatoire.')
      .max(160, 'Le libellé ne peut pas dépasser 160 caractères.'),
    amountEuros: z
      .number({ message: 'Veuillez saisir un montant valide.' })
      .positive('Le montant doit être strictement supérieur à 0 €.'),
    recurrenceType: z.enum(['interval', 'specific_months', 'one_off']),
    intervalMonths: z
      .number()
      .int('Le nombre de mois doit être entier.')
      .min(1, "L'intervalle doit être compris entre 1 et 120 mois.")
      .max(120, "L'intervalle doit être compris entre 1 et 120 mois."),
    specificMonths: z.array(z.number().int().min(1).max(12)),
    isVariable: z.boolean(),
    allocation: z.enum(['on_due', 'smoothed']),
    effectiveFrom: periodSchema,
    endPeriod: optionalPeriodSchema,
    dueDay: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val === '') return true;
          const num = Number(val);
          return Number.isInteger(num) && num >= 1 && num <= 31;
        },
        { message: "Le jour d'échéance doit être compris entre 1 et 31." }
      ),
    paidByMemberId: z.string(),
    splitStrategy: z.enum(['default', 'equals', 'percentage', 'amount']),
  })
  .superRefine((data, ctx) => {
    if (
      data.recurrenceType === 'specific_months' &&
      data.specificMonths.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['specificMonths'],
        message: 'Sélectionnez au moins un mois de prélèvement.',
      });
    }
    if (data.endPeriod && data.endPeriod < data.effectiveFrom) {
      ctx.addIssue({
        code: 'custom',
        path: ['endPeriod'],
        message: 'La fin de validité doit être postérieure ou égale au début.',
      });
    }
  });

export type BudgetItemFormValues = z.infer<typeof budgetItemFormSchema>;

export const adjustmentFormSchema = z
  .object({
    type: z.enum(['include', 'exclude', 'amount']),
    amountEuros: z.string().trim(),
    note: z
      .string()
      .trim()
      .max(255, 'La note ne peut pas dépasser 255 caractères.'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'amount') {
      const parsed = Number(data.amountEuros.replace(',', '.'));
      if (data.amountEuros === '' || !Number.isFinite(parsed) || parsed < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountEuros'],
          message: 'Veuillez indiquer un montant réel valide (≥ 0 €).',
        });
      }
    }
  });

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export const addMemberSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Le nom du membre est obligatoire.')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
  email: z
    .string()
    .trim()
    .refine((val) => val === '' || z.email().safeParse(val).success, {
      message: 'Veuillez renseigner une adresse e-mail valide.',
    }),
  role: z.enum(['editor', 'viewer']),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export const inviteMemberSchema = z
  .object({
    channel: z.enum(['email', 'link']),
    email: z.string().trim(),
    displayName: z
      .string()
      .trim()
      .max(120, 'Le nom ne peut pas dépasser 120 caractères.'),
    memberId: z.string(),
    maxUses: z
      .number()
      .int()
      .min(1, 'Minimum 1 utilisation.')
      .max(50, 'Maximum 50 utilisations.'),
    ttlDays: z
      .number()
      .int()
      .min(1, 'Minimum 1 jour.')
      .max(30, 'Maximum 30 jours.'),
  })
  .superRefine((data, ctx) => {
    if (data.channel === 'email' && !z.email().safeParse(data.email).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: "Une adresse e-mail valide est requise pour l'envoi par e-mail.",
      });
    }
  });

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du tag est obligatoire.')
    .max(50, 'Le nom du tag ne peut pas dépasser 50 caractères.'),
  color: z.enum(tagColorValues),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
