import {
  AddExpensePayload,
  CreateExpenseGroupPayload,
  ExpenseGroupDetail,
  ExpenseGroupListResponse,
  ExpenseListFilters,
  ExpenseListResponse,
  ExpenseMutationResponse,
  GroupBalancesResponse,
  RecordSettlementPayload,
  SettlementListResponse,
  SettlementMutationResponse,
  UpdateExpenseGroupPayload,
} from '@/types/expenseSplitter.types';
import { toApiError } from './apiError';
import { fetchAPI } from './fetchAPI';

const EXPENSE_GROUPS_BASE_URL = '/expense-groups';

// ─────────────────────────────────────────────────────────────────────────────
// Groupes de dépenses (/api/expense-groups)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/expense-groups : liste les groupes de dépenses de l'utilisateur */
export const fetchExpenseGroups = async (): Promise<ExpenseGroupListResponse> => {
  const res = await fetchAPI<ExpenseGroupListResponse>(EXPENSE_GROUPS_BASE_URL);

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement des groupes de dépenses');
  }

  return res.data;
};

/** POST /api/expense-groups : crée un groupe de dépenses avec ses participants initiaux */
export const createExpenseGroup = async (
  payload: CreateExpenseGroupPayload
): Promise<ExpenseGroupDetail> => {
  const res = await fetchAPI<ExpenseGroupDetail>(EXPENSE_GROUPS_BASE_URL, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la création du groupe de dépenses');
  }

  return res.data;
};

/** GET /api/expense-groups/{id} : détail du groupe, participants, soldes et plan de virements */
export const fetchExpenseGroup = async (groupId: string): Promise<ExpenseGroupDetail> => {
  const res = await fetchAPI<ExpenseGroupDetail>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}`
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement du groupe de dépenses');
  }

  return res.data;
};

/** PUT /api/expense-groups/{id} : renomme un groupe de dépenses */
export const updateExpenseGroup = async (
  groupId: string,
  payload: UpdateExpenseGroupPayload
): Promise<ExpenseGroupDetail> => {
  const res = await fetchAPI<ExpenseGroupDetail>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la modification du groupe de dépenses');
  }

  return res.data;
};

/** DELETE /api/expense-groups/{id} : clôture (archive) un groupe de dépenses */
export const closeExpenseGroup = async (groupId: string): Promise<void> => {
  const res = await fetchAPI(`${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la clôture du groupe de dépenses');
  }
};

/** GET /api/expense-groups/{id}/balances : soldes des participants et plan de virements */
export const fetchExpenseGroupBalances = async (groupId: string): Promise<GroupBalancesResponse> => {
  const res = await fetchAPI<GroupBalancesResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/balances`
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du calcul des soldes');
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Dépenses (/api/expense-groups/{id}/expenses)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/expense-groups/{id}/expenses?from=&to=&tagId=&paidBy= */
export const fetchExpenses = async (
  groupId: string,
  filters?: ExpenseListFilters
): Promise<ExpenseListResponse> => {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.tagId) params.set('tagId', filters.tagId);
  if (filters?.paidBy) params.set('paidBy', filters.paidBy);

  const query = params.toString();
  const endpoint = `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/expenses${query ? `?${query}` : ''}`;
  const res = await fetchAPI<ExpenseListResponse>(endpoint);

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement des dépenses');
  }

  return res.data;
};

/** POST /api/expense-groups/{id}/expenses : ajoute une dépense et renvoie les soldes mis à jour */
export const addExpense = async (
  groupId: string,
  payload: AddExpensePayload
): Promise<ExpenseMutationResponse> => {
  const res = await fetchAPI<ExpenseMutationResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/expenses`,
    {
      method: 'POST',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'ajout de la dépense");
  }

  return res.data;
};

/** PUT /api/expense-groups/{id}/expenses/{expenseId} : corrige une dépense (remplace l'ancienne) */
export const correctExpense = async (
  groupId: string,
  expenseId: string,
  payload: AddExpensePayload
): Promise<ExpenseMutationResponse> => {
  const res = await fetchAPI<ExpenseMutationResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors de la correction de la dépense');
  }

  return res.data;
};

/** DELETE /api/expense-groups/{id}/expenses/{expenseId} : annule une dépense et renvoie les soldes */
export const voidExpense = async (
  groupId: string,
  expenseId: string
): Promise<GroupBalancesResponse> => {
  const res = await fetchAPI<GroupBalancesResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'annulation de la dépense");
  }

  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Remboursements (/api/expense-groups/{id}/settlements)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/expense-groups/{id}/settlements : liste les remboursements actifs du groupe */
export const fetchSettlements = async (groupId: string): Promise<SettlementListResponse> => {
  const res = await fetchAPI<SettlementListResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/settlements`
  );

  if (!res.ok) {
    throw toApiError(res, 'Erreur lors du chargement des remboursements');
  }

  return res.data;
};

/** POST /api/expense-groups/{id}/settlements : enregistre un remboursement (« Marquer comme payé ») */
export const recordSettlement = async (
  groupId: string,
  payload: RecordSettlementPayload
): Promise<SettlementMutationResponse> => {
  const res = await fetchAPI<SettlementMutationResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/settlements`,
    {
      method: 'POST',
      body: payload,
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'enregistrement du remboursement");
  }

  return res.data;
};

/** DELETE /api/expense-groups/{id}/settlements/{settlementId} : annule un remboursement */
export const voidSettlement = async (
  groupId: string,
  settlementId: string
): Promise<GroupBalancesResponse> => {
  const res = await fetchAPI<GroupBalancesResponse>(
    `${EXPENSE_GROUPS_BASE_URL}/${encodeURIComponent(groupId)}/settlements/${encodeURIComponent(settlementId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) {
    throw toApiError(res, "Erreur lors de l'annulation du remboursement");
  }

  return res.data;
};
