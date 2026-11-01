import {
  AdjustmentType,
  AllocationMode,
  CalculatedLine,
  CurrencyCode,
  ItemKind,
  MemberRole,
  MemberStatus,
  PeriodString,
  RecurrenceType,
  SplitStrategy,
  TagColor,
} from '@/types/budget.types';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  income: 'Revenus',
  expense: 'Charges',
  savings: 'Épargne',
};

export const ITEM_KIND_SINGULAR_LABELS: Record<ItemKind, string> = {
  income: 'Revenu',
  expense: 'Charge',
  savings: 'Épargne',
};

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  interval: 'Périodique (tous les N mois)',
  specific_months: 'Mois spécifiques de l’année',
  one_off: 'Ponctuel (un seul mois)',
};

export const ALLOCATION_MODE_LABELS: Record<AllocationMode, string> = {
  on_due: "À l'échéance",
  smoothed: 'Lissé mensuellement',
};

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  include: 'Compter ce mois-ci',
  exclude: 'Exclure ce mois-ci',
  amount: 'Montant réel ce mois-ci',
};

export const SPLIT_STRATEGY_LABELS: Record<SplitStrategy, string> = {
  equals: 'Parts égales',
  percentage: 'Pourcentage personnalisé',
  amount: 'Montant fixe par membre',
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Propriétaire',
  editor: 'Éditeur',
  viewer: 'Lecteur',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Actif',
  invited: 'Invité',
  left: 'Parti',
};

export const MONTH_OPTIONS: ReadonlyArray<{
  value: number;
  label: string;
  shortLabel: string;
}> = [
  { value: 1, label: 'Janvier', shortLabel: 'Jan.' },
  { value: 2, label: 'Février', shortLabel: 'Fév.' },
  { value: 3, label: 'Mars', shortLabel: 'Mars' },
  { value: 4, label: 'Avril', shortLabel: 'Avr.' },
  { value: 5, label: 'Mai', shortLabel: 'Mai' },
  { value: 6, label: 'Juin', shortLabel: 'Juin' },
  { value: 7, label: 'Juillet', shortLabel: 'Juil.' },
  { value: 8, label: 'Août', shortLabel: 'Août' },
  { value: 9, label: 'Septembre', shortLabel: 'Sept.' },
  { value: 10, label: 'Octobre', shortLabel: 'Oct.' },
  { value: 11, label: 'Novembre', shortLabel: 'Nov.' },
  { value: 12, label: 'Décembre', shortLabel: 'Déc.' },
];

export const TAG_COLOR_PALETTE: ReadonlyArray<{
  value: TagColor;
  label: string;
  hex: string;
}> = [
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'amber', label: 'Ambre', hex: '#f59e0b' },
  { value: 'yellow', label: 'Jaune', hex: '#eab308' },
  { value: 'lime', label: 'Citron vert', hex: '#84cc16' },
  { value: 'green', label: 'Vert', hex: '#22c55e' },
  { value: 'teal', label: 'Sarcelle', hex: '#14b8a6' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'purple', label: 'Violet', hex: '#a855f7' },
  { value: 'pink', label: 'Rose', hex: '#ec4899' },
  { value: 'gray', label: 'Gris', hex: '#6b7280' },
];

/** Convertit un montant en centimes vers des euros (ex: `1250` -> `12.5`) */
export const centsToEuros = (amountCents: number): number =>
  Math.round(amountCents) / 100;

/** Convertit un montant en euros vers des centimes entiers (ex: `12.5` -> `1250`) */
export const eurosToCents = (euros: number): number =>
  Math.round((Number.isFinite(euros) ? euros : 0) * 100);

/** Formate un montant en centimes en devise française (ex: `117000` -> `1 170,00 €`) */
export const formatMoney = (
  amountCents: number,
  currency: CurrencyCode = 'EUR'
): string => {
  const safeCents = Number.isFinite(amountCents) ? amountCents : 0;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeCents / 100);
  } catch {
    return `${(safeCents / 100).toFixed(2)} ${currency || 'EUR'}`;
  }
};

/** Formate un écart en centimes avec son signe (`+42,50 €` ou `-42,50 €`) */
export const formatSignedMoney = (
  deltaCents: number,
  currency: CurrencyCode = 'EUR'
): string => {
  const formatted = formatMoney(Math.abs(deltaCents), currency);
  if (deltaCents > 0) return `+${formatted}`;
  if (deltaCents < 0) return `-${formatted}`;
  return formatted;
};

/** Convertit des points de base (`10000 = 100%`) en pourcentage décimal (`7000` -> `70`) */
export const basisPointsToPercent = (basisPoints: number): number =>
  Math.round(basisPoints) / 100;

/** Convertit un pourcentage (`0..100`) en points de base entiers (`70` -> `7000`) */
export const percentToBasisPoints = (percent: number): number =>
  Math.round((Number.isFinite(percent) ? percent : 0) * 100);

/** Formate des points de base en chaîne de pourcentage (ex: `7000` -> `70 %`, `3333` -> `33,33 %`) */
export const formatBasisPoints = (basisPoints: number): string => {
  const percent = basisPointsToPercent(basisPoints);
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(percent)} %`;
};

/** Formate un ratio ou pourcentage de charges (supporte `0.358` ou `35.8`) */
export const formatRatioPercent = (ratio: number | null | undefined): string => {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return '—';
  }
  const isFraction =
    Math.abs(ratio) < 1 &&
    ratio !== 0 &&
    Math.round(ratio * 10) !== ratio * 10;
  const percentValue = isFraction ? ratio * 100 : ratio;
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percentValue)} %`;
};

/** Vérifie qu'une chaîne respecte le format de période `AAAA-MM` */
export const isValidPeriod = (period: string): period is PeriodString =>
  PERIOD_REGEX.test(period);

/** Formate une période `AAAA-MM` en libellé lisible (ex: `'2026-03'` -> `'Mars 2026'`) */
export const formatPeriodLabel = (period: PeriodString): string => {
  if (!isValidPeriod(period)) {
    return period;
  }
  const [yearStr, monthStr] = period.split('-');
  const monthIndex = Number(monthStr);
  const month = MONTH_OPTIONS.find((item) => item.value === monthIndex);
  return month ? `${month.label} ${yearStr}` : period;
};

/** Extrait la date `AAAA-MM-JJ` sans décalage de fuseau horaire (ou la date du jour par défaut) */
export const toIsoDateInput = (dateStr?: string | null): string => {
  if (dateStr) {
    const match = ISO_DATE_PREFIX_REGEX.exec(dateStr.trim());
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Formate une date `AAAA-MM-JJ` (ou ISO `2026-08-05T02:00:00+02:00`) en `JJ/MM/AAAA` sans décalage UTC */
export const formatDateShort = (dateStr: string): string => {
  const match = ISO_DATE_PREFIX_REGEX.exec(dateStr.trim());
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString('fr-FR');
};

/** Calcule la somme de points de base */
export const sumBasisPoints = (values: number[]): number =>
  values.reduce((acc, val) => acc + (Number.isFinite(val) ? Math.round(val) : 0), 0);

/** Répartit `10000` points de base en parts égales sur `count` membres */
export const distributeEqualBasisPoints = (count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(10000 / count);
  const remainder = 10000 - base * count;
  return Array.from({ length: count }, (_, idx) => (idx < remainder ? base + 1 : base));
};

/** Répartit un montant en centimes en parts égales selon la règle d'arrondi déterministe (les premiers reçoivent +1 centime) */
export const distributeEqualAmounts = (
  totalCents: number,
  count: number
): number[] => {
  if (count <= 0 || totalCents <= 0) {
    return Array.from({ length: Math.max(0, count) }, () => 0);
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, idx) =>
    idx < remainder ? base + 1 : base
  );
};

export interface RebalanceSplitResult {
  values: Record<string, string>;
  editedIds: string[];
}

/**
 * Répartit équitablement le reste (en centimes pour `amount`, ou en points de base pour `percentage`)
 * entre les participants inclus dont la part n'a pas été modifiée manuellement.
 */
export const rebalanceSplitInputs = (params: {
  strategy: 'amount' | 'percentage';
  totalAmountCents: number;
  includedIds: string[];
  currentValues: Record<string, string>;
  editedIds: string[];
  changedMemberId?: string;
  newRawValue?: string;
}): RebalanceSplitResult => {
  const {
    strategy,
    totalAmountCents,
    includedIds,
    currentValues,
    editedIds,
    changedMemberId,
    newRawValue,
  } = params;

  const nextValues: Record<string, string> = { ...currentValues };
  if (changedMemberId !== undefined && newRawValue !== undefined) {
    nextValues[changedMemberId] = newRawValue;
  }

  if (includedIds.length === 0) {
    return { values: nextValues, editedIds: [] };
  }

  let nextEditedIds = editedIds.filter((id) => includedIds.includes(id));
  if (changedMemberId !== undefined && includedIds.includes(changedMemberId)) {
    if (!nextEditedIds.includes(changedMemberId)) {
      nextEditedIds = [...nextEditedIds, changedMemberId];
    }
  }

  let unmodifiedIds = includedIds.filter((id) => !nextEditedIds.includes(id));

  if (
    unmodifiedIds.length === 0 &&
    changedMemberId !== undefined &&
    includedIds.length > 1
  ) {
    nextEditedIds = [changedMemberId];
    unmodifiedIds = includedIds.filter((id) => id !== changedMemberId);
  }

  if (unmodifiedIds.length === 0) {
    return { values: nextValues, editedIds: nextEditedIds };
  }

  const totalUnits =
    strategy === 'percentage' ? 10000 : Math.max(0, totalAmountCents);

  const modifiedUnitsSum = nextEditedIds.reduce((acc, id) => {
    const raw = Number((nextValues[id] ?? '0').replace(',', '.'));
    const safeNum = Number.isFinite(raw) && raw > 0 ? raw : 0;
    const units =
      strategy === 'percentage'
        ? percentToBasisPoints(safeNum)
        : eurosToCents(safeNum);
    return acc + units;
  }, 0);

  const remainingUnits = Math.max(0, totalUnits - modifiedUnitsSum);
  const distributedUnits = distributeEqualAmounts(
    remainingUnits,
    unmodifiedIds.length
  );

  unmodifiedIds.forEach((id, idx) => {
    const units = distributedUnits[idx] ?? 0;
    nextValues[id] =
      strategy === 'percentage'
        ? (units / 100).toFixed(2)
        : String(centsToEuros(units));
  });

  return {
    values: nextValues,
    editedIds: nextEditedIds,
  };
};

/** Résume la périodicité et le mode d'allocation d'une ligne calculée */
export const formatLineRecurrenceSummary = (
  line: Pick<
    CalculatedLine,
    | 'isMonthly'
    | 'recurrenceType'
    | 'allocation'
    | 'dueDay'
    | 'isVariable'
    | 'recurrenceParams'
  >
): string => {
  const parts: string[] = [];

  if (line.isMonthly) {
    parts.push('Mensuel');
  } else if (line.recurrenceType === 'one_off') {
    parts.push('Ponctuel');
  } else if (line.recurrenceType === 'specific_months') {
    const rawMonths = line.recurrenceParams?.months;
    if (Array.isArray(rawMonths) && rawMonths.length > 0) {
      const monthLabels = rawMonths
        .map((m) => Number(m))
        .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12)
        .sort((a, b) => a - b)
        .map(
          (m) =>
            MONTH_OPTIONS.find((opt) => opt.value === m)?.shortLabel ?? String(m)
        );
      parts.push(
        monthLabels.length > 0
          ? `Mois spécifiques (${monthLabels.join(', ')})`
          : 'Mois spécifiques'
      );
    } else {
      parts.push('Mois spécifiques');
    }
  } else if (line.recurrenceType === 'interval') {
    const interval = Number(line.recurrenceParams?.interval);
    if (Number.isInteger(interval) && interval > 1) {
      parts.push(`Tous les ${interval} mois`);
    } else {
      parts.push('Périodique');
    }
  }

  if (!line.isMonthly && line.allocation === 'smoothed') {
    parts.push('Lissé');
  } else if (!line.isMonthly && line.allocation === 'on_due') {
    parts.push("À l'échéance");
  }

  if (line.dueDay) {
    parts.push(`le ${line.dueDay}`);
  }

  if (line.isVariable) {
    parts.push('Variable');
  }

  return parts.join(' • ');
};
