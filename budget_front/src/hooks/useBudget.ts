import { getCurrentPeriod, useBudgetStore } from '@/stores/budget.store';
import { BoardSummary, CalculatedBoard, PeriodString, Tag } from '@/types/budget.types';

export interface UseBudgetReturn {
  period: PeriodString;
  isCurrentPeriod: boolean;
  boards: BoardSummary[];
  personalBoard: BoardSummary | null;
  sharedBoards: BoardSummary[];
  currentBoard: CalculatedBoard | null;
  tags: Tag[];
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
}

export const useBudget = (): UseBudgetReturn => {
  const {
    period,
    boards,
    currentBoard,
    tags,
    dismissedInsightKeys,
    isLoadingBoards,
    isLoadingBoard,
    setPeriod,
    shiftPeriod,
    nextPeriod,
    previousPeriod,
    resetToCurrentPeriod,
    setCurrentBoard,
    loadBoards,
    loadBoard,
    loadTags,
    dismissInsight,
    clearDismissedInsights,
  } = useBudgetStore();

  const personalBoard = boards.find((board) => board.type === 'personal') ?? null;
  const sharedBoards = boards.filter((board) => board.type === 'shared');
  const isCurrentPeriod = period === getCurrentPeriod();

  return {
    period,
    isCurrentPeriod,
    boards,
    personalBoard,
    sharedBoards,
    currentBoard,
    tags,
    dismissedInsightKeys,
    isLoadingBoards,
    isLoadingBoard,
    setPeriod,
    shiftPeriod,
    nextPeriod,
    previousPeriod,
    resetToCurrentPeriod,
    setCurrentBoard,
    loadBoards,
    loadBoard,
    loadTags,
    dismissInsight,
    clearDismissedInsights,
  };
};
