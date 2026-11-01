/** Mois au format `AAAA-MM` */
export type PeriodString = string;

/** Code ISO 4217 en majuscules (ex: `EUR`) */
export type CurrencyCode = string;

export type BoardType = 'personal' | 'shared' | 'expense_group';

export type RollupDisplayMode = 'grouped' | 'detailed';

export interface BoardSettings {
  rollupDisplay?: RollupDisplayMode;
  [key: string]: unknown;
}

export type MemberRole = 'owner' | 'editor' | 'viewer';

export type EditableMemberRole = 'editor' | 'viewer';

export type MemberStatus = 'invited' | 'active' | 'left';

export type ItemKind = 'income' | 'expense' | 'savings';

export type RecurrenceType = 'interval' | 'specific_months' | 'one_off';

export type AllocationMode = 'on_due' | 'smoothed';

export type AdjustmentType = 'include' | 'exclude' | 'amount';

export type SplitStrategy = 'equals' | 'percentage' | 'amount';

export type InvitationChannel = 'email' | 'link';

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type TagColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'gray';

export type TagScope = 'user' | 'board';

export interface Money {
  amountCents: number;
  currency: CurrencyCode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tags (/api/tags)
// ─────────────────────────────────────────────────────────────────────────────

export interface TagSummary {
  id: string;
  name: string;
  color: TagColor;
  hex: string;
}

export interface Tag extends TagSummary {
  boardId: string | null;
  scope: TagScope;
}

export interface TagListResponse {
  tags: Tag[];
}

export interface TagPayload {
  name: string;
  color: TagColor;
  boardId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Membres (/api/boards/{id}/members)
// ─────────────────────────────────────────────────────────────────────────────

/** Membre sérialisé avec le groupe `member.read` */
export interface BoardMember {
  id: string;
  displayName: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string | null;
  leftAt: string | null;
  userId: string | null;
  isLinked: boolean;
}

/** Membre tel que renvoyé dans le `BoardResult` calculé */
export interface CalculatedBoardMember {
  id: string;
  displayName: string;
  status: MemberStatus;
  role: MemberRole;
  userId: string | null;
}

export interface AddMemberPayload {
  displayName: string;
  email?: string | null;
  role?: EditableMemberRole;
}

export interface AddMemberResponse {
  member: BoardMember;
  invitationSent: boolean;
}

export interface UpdateMemberPayload {
  displayName?: string | null;
  role?: EditableMemberRole | null;
  /** Nouvelle part en points de base (10 000 = 100 %) */
  shareBasisPoints?: number | null;
  effectiveFrom?: PeriodString | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Invitations (/api/boards/{id}/invitations & /api/invitations/{token})
// ─────────────────────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  boardId: string | null;
  memberId: string | null;
  email: string | null;
  channel: InvitationChannel;
  status: InvitationStatus;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InviteMemberPayload {
  channel?: InvitationChannel;
  email?: string | null;
  memberId?: string | null;
  displayName?: string | null;
  maxUses?: number;
  ttlDays?: number;
}

export interface InviteMemberResponse {
  invitation: Invitation;
  member: BoardMember;
  /** Renvoyé uniquement lors de la création pour le canal `link` */
  url: string | null;
}

export interface InvitationPreview {
  boardName: string;
  boardType: BoardType;
  boardTypeLabel: string;
  invitedBy: string | null;
  memberName: string;
  expiresAt: string;
  status: InvitationStatus;
  isUsable: boolean;
}

export interface AcceptInvitationResponse {
  message: string;
  boardId: string;
  boardType: BoardType;
  memberId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Boards & Calcul (/api/boards)
// ─────────────────────────────────────────────────────────────────────────────

/** Entité Board sérialisée avec le groupe `board.read` */
export interface BoardEntity {
  id: string;
  type: BoardType;
  name: string;
  currency: CurrencyCode;
  settings: BoardSettings;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
}

export interface BoardPermissions {
  canEdit: boolean;
  canManageMembers: boolean;
}

export interface PresentedBoardMeta {
  id: string;
  type: BoardType;
  name: string;
  currency: CurrencyCode;
  settings: BoardSettings;
  myMemberId: string | null;
  permissions: BoardPermissions;
}

export interface BoardTotals {
  incomeCents: number;
  expenseCents: number;
  ownSavingsCents: number;
  rollupExpenseCents: number;
  rollupSavingsCents: number;
  chargesCents: number;
  savingsCents: number;
  remainingCents: number;
  chargesRatio: number | null;
  householdCents: number;
}

export interface BalanceTransfer {
  from: string;
  to: string;
  amountCents: number;
  fromName: string;
  toName: string;
}

export interface BoardBalance {
  contributions: Record<string, number>;
  balances: Record<string, number>;
  transfers: BalanceTransfer[];
  summary: string | null;
}

export interface BoardSummaryBalance {
  contributionCents: number | null;
  balanceCents: number | null;
  summary: string | null;
}

export interface BoardSummary {
  id: string;
  type: BoardType;
  name: string;
  currency: CurrencyCode;
  role: MemberRole | null;
  memberCount: number;
  totals: BoardTotals;
  myShareCents: number | null;
  balance: BoardSummaryBalance | null;
}

export interface BoardListResponse {
  period: PeriodString;
  boards: BoardSummary[];
}

export interface CalculatedLine {
  itemId: string;
  kind: ItemKind;
  label: string;
  position: number;
  isActive: boolean;
  isDue: boolean;
  isMonthly: boolean;
  isVariable: boolean;
  amountCents: number;
  ruleAmountCents: number | null;
  recurrenceType: RecurrenceType | string | null;
  allocation: AllocationMode | string | null;
  dueDay: number | null;
  paidByMemberId: string | null;
  adjustmentType: AdjustmentType | string | null;
  tags: TagSummary[];
  /** memberId => part du mois en centimes */
  shares: Record<string, number>;
  recurrenceParams?: RecurrenceParams;
  endPeriod?: PeriodString | null;
}

export interface RollupLine {
  sourceItemId: string;
  kind: ItemKind;
  label: string;
  amountCents: number;
  householdAmountCents: number;
  isDue: boolean;
  isMonthly: boolean;
  isVariable: boolean;
  allocation: AllocationMode | string | null;
  dueDay: number | null;
  hasAdjustment: boolean;
  tags: TagSummary[];
}

export interface RollupResult {
  linkId: string;
  type: string;
  sourceBoardId: string;
  sourceBoardName: string;
  memberId: string | null;
  expenseCents: number;
  savingsCents: number;
  contributionCents: number | null;
  balanceCents: number | null;
  lines: RollupLine[];
}

export interface CalculatedBoard {
  board: PresentedBoardMeta;
  boardId: string;
  type: BoardType;
  name: string;
  currency: CurrencyCode;
  period: PeriodString;
  members: CalculatedBoardMember[];
  lines: CalculatedLine[];
  rollups: RollupResult[];
  totals: BoardTotals;
  /** memberId => total des parts du mois en centimes */
  memberShares: Record<string, number>;
  balance: BoardBalance | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payloads d'écriture (Boards, Répartition, Postes, Exceptions)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateBoardPayload {
  type?: 'personal' | 'shared';
  name: string;
  currency?: CurrencyCode;
  settings?: BoardSettings;
  guests?: string[];
}

export interface UpdateBoardPayload {
  name: string;
  settings?: BoardSettings | null;
}

export interface SplitRuleEntryPayload {
  memberId: string;
  value?: number | null;
}

export interface SplitRulePayload {
  strategy: SplitStrategy;
  effectiveFrom?: PeriodString | null;
  entries?: SplitRuleEntryPayload[];
}

export interface RecurrenceParams {
  /** Pour `interval` (1 à 120) */
  interval?: number;
  /** Mois d'ancrage `AAAA-MM` pour `interval` */
  anchor?: PeriodString;
  /** Mois de l'année (1 à 12) pour `specific_months` */
  months?: number[];
  /** Indique une facture à montant variable (ex: électricité) */
  variable?: boolean;
  [key: string]: unknown;
}

export interface CreateItemPayload {
  kind: ItemKind;
  label: string;
  amountCents: number;
  recurrenceType?: RecurrenceType;
  recurrenceParams?: RecurrenceParams;
  allocation?: AllocationMode;
  effectiveFrom?: PeriodString | null;
  endPeriod?: PeriodString | null;
  dueDay?: number | null;
  paidByMemberId?: string | null;
  position?: number | null;
  tagIds?: string[];
  splitStrategy?: SplitStrategy | null;
  splitEntries?: SplitRuleEntryPayload[];
}

export interface ReviseItemPayload {
  label: string;
  amountCents: number;
  recurrenceType?: RecurrenceType;
  recurrenceParams?: RecurrenceParams;
  allocation?: AllocationMode;
  effectiveFrom: PeriodString;
  endPeriod?: PeriodString | null;
  dueDay?: number | null;
  paidByMemberId?: string | null;
  position?: number | null;
  /** `null` conserve les tags existants ; `[]` les retire tous */
  tagIds?: string[] | null;
  /** `null` conserve la répartition existante */
  splitStrategy?: SplitStrategy | null;
  splitEntries?: SplitRuleEntryPayload[];
}

export interface SetAdjustmentPayload {
  type: AdjustmentType;
  /** Obligatoire lorsque `type === 'amount'` */
  amountCents?: number | null;
  params?: Record<string, unknown> | null;
  note?: string | null;
}
