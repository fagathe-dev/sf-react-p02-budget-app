import {
  BalanceTransfer,
  BoardEntity,
  BoardMember,
  CurrencyCode,
  Money,
  SplitStrategy,
} from './budget.types';

/** Date au format `AAAA-MM-JJ` */
export type DateString = string;

// ─────────────────────────────────────────────────────────────────────────────
// Groupes de dépenses & Soldes (/api/expense-groups)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseGroupSummary {
  id: string;
  name: string;
  currency: CurrencyCode;
  memberCount: number;
  totalSpentCents: number;
  myBalanceCents: number | null;
  createdAt: string;
}

export interface ExpenseGroupListResponse {
  groups: ExpenseGroupSummary[];
}

export interface MemberBalance {
  memberId: string;
  displayName: string;
  paidCents: number;
  owedCents: number;
  sentCents: number;
  receivedCents: number;
  balanceCents: number;
}

export interface GroupBalancesResponse {
  totalSpentCents: number;
  balances: MemberBalance[];
  transfers: BalanceTransfer[];
}

export interface ExpenseGroupDetail extends GroupBalancesResponse {
  group: BoardEntity;
  members: BoardMember[];
  myMemberId: string | null;
}

export interface CreateExpenseGroupPayload {
  name: string;
  currency?: CurrencyCode;
  participants?: string[];
}

export interface UpdateExpenseGroupPayload {
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dépenses (/api/expense-groups/{id}/expenses)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseShare {
  memberId: string;
  amountCents: number;
  inputValue: number | null;
}

export interface Expense {
  id: string;
  label: string;
  amount: Money;
  spentOn: string;
  splitStrategy: SplitStrategy | string;
  paidByMemberId: string;
  tagId: string | null;
  supersedesId: string | null;
  isVoided: boolean;
  voidedAt: string | null;
  createdAt: string;
  shares: ExpenseShare[];
}

export interface ExpenseListResponse {
  expenses: Expense[];
}

export interface ExpenseMutationResponse extends GroupBalancesResponse {
  expense: Expense;
}

export interface ExpenseParticipantPayload {
  memberId: string;
  value?: number | null;
}

export interface AddExpensePayload {
  paidByMemberId: string;
  amountCents: number;
  spentOn: DateString;
  label: string;
  tagId?: string | null;
  splitStrategy?: SplitStrategy;
  participants: ExpenseParticipantPayload[];
}

export interface ExpenseListFilters {
  from?: DateString;
  to?: DateString;
  tagId?: string;
  paidBy?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Remboursements (/api/expense-groups/{id}/settlements)
// ─────────────────────────────────────────────────────────────────────────────

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: Money;
  settledOn: string;
  note: string | null;
  isVoided: boolean;
  voidedAt: string | null;
  createdAt: string;
}

export interface SettlementListResponse {
  settlements: Settlement[];
}

export interface SettlementMutationResponse extends GroupBalancesResponse {
  settlement: Settlement;
}

export interface RecordSettlementPayload {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  settledOn?: DateString | null;
  note?: string | null;
}
