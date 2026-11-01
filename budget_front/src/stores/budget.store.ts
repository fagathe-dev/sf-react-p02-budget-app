import { fetchBoard, fetchBoards, fetchTags } from '@/services/budget.api';
import { appStorage } from '@/services/storage.service';
import { BoardSummary, CalculatedBoard, PeriodString, Tag } from '@/types/budget.types';
import { create } from 'zustand';

const DISMISSED_INSIGHTS_KEY = 'budget_dismissed_insights';

/** Retourne le mois courant au format `AAAA-MM` */
export const getCurrentPeriod = (now: Date = new Date()): PeriodString => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/** Décale un mois `AAAA-MM` de `deltaMonths` mois */
export const shiftPeriodString = (period: PeriodString, deltaMonths: number): PeriodString => {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return getCurrentPeriod();
  }

  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (((totalMonths % 12) + 12) % 12) + 1;

  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`;
};

const readDismissedInsightKeys = (): string[] => {
  const raw = appStorage.get(DISMISSED_INSIGHTS_KEY);
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
};

export interface BudgetState {
  /** Mois affiché au format `AAAA-MM` */
  period: PeriodString;
  /** Liste des boards (board perso puis boards partagés) pour le mois courant */
  boards: BoardSummary[];
  /** Board actuellement ouvert et calculé */
  currentBoard: CalculatedBoard | null;
  /** Tags chargés (personnels ou du board courant) */
  tags: Tag[];
  /** Clés stables d'insights masqués par l'utilisateur */
  dismissedInsightKeys: string[];
  isLoadingBoards: boolean;
  isLoadingBoard: boolean;
  setPeriod: (period: PeriodString) => void;
  shiftPeriod: (deltaMonths: number) => PeriodString;
  nextPeriod: () => PeriodString;
  previousPeriod: () => PeriodString;
  resetToCurrentPeriod: () => PeriodString;
  setCurrentBoard: (board: CalculatedBoard | null) => void;
  loadBoards: (month?: PeriodString) => Promise<BoardSummary[]>;
  loadBoard: (boardId: string, month?: PeriodString) => Promise<CalculatedBoard>;
  loadTags: (boardId?: string) => Promise<Tag[]>;
  dismissInsight: (key: string) => void;
  clearDismissedInsights: () => void;
  reset: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  period: getCurrentPeriod(),
  boards: [],
  currentBoard: null,
  tags: [],
  dismissedInsightKeys: readDismissedInsightKeys(),
  isLoadingBoards: false,
  isLoadingBoard: false,

  setPeriod: (period: PeriodString) => {
    set({ period });
  },

  shiftPeriod: (deltaMonths: number) => {
    const next = shiftPeriodString(get().period, deltaMonths);
    set({ period: next });
    return next;
  },

  nextPeriod: () => get().shiftPeriod(1),

  previousPeriod: () => get().shiftPeriod(-1),

  resetToCurrentPeriod: () => {
    const current = getCurrentPeriod();
    set({ period: current });
    return current;
  },

  setCurrentBoard: (board: CalculatedBoard | null) => {
    set(board ? { currentBoard: board, period: board.period } : { currentBoard: null });
  },

  loadBoards: async (month?: PeriodString) => {
    const targetPeriod = month ?? get().period;
    set({ isLoadingBoards: true });

    try {
      const res = await fetchBoards(targetPeriod);
      set({
        boards: res.boards,
        period: res.period,
        isLoadingBoards: false,
      });
      return res.boards;
    } catch (err) {
      set({ isLoadingBoards: false });
      throw err;
    }
  },

  loadBoard: async (boardId: string, month?: PeriodString) => {
    const targetPeriod = month ?? get().period;
    set({ isLoadingBoard: true });

    try {
      const board = await fetchBoard(boardId, targetPeriod);
      set({
        currentBoard: board,
        period: board.period,
        isLoadingBoard: false,
      });
      return board;
    } catch (err) {
      set({ isLoadingBoard: false });
      throw err;
    }
  },

  loadTags: async (boardId?: string) => {
    const res = await fetchTags(boardId);
    set({ tags: res.tags });
    return res.tags;
  },

  dismissInsight: (key: string) => {
    const existing = get().dismissedInsightKeys;
    if (existing.includes(key)) return;

    const updated = [...existing, key];
    appStorage.set(DISMISSED_INSIGHTS_KEY, updated);
    set({ dismissedInsightKeys: updated });
  },

  clearDismissedInsights: () => {
    appStorage.remove(DISMISSED_INSIGHTS_KEY);
    set({ dismissedInsightKeys: [] });
  },

  reset: () => {
    set({
      period: getCurrentPeriod(),
      boards: [],
      currentBoard: null,
      tags: [],
      isLoadingBoards: false,
      isLoadingBoard: false,
    });
  },
}));
