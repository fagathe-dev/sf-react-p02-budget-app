import { ItemKind, PeriodString, TagSummary } from './budget.types';

export type InsightLevel = 'alert' | 'warning' | 'reminder' | 'suggestion' | 'info';

export interface InsightKpis {
  incomeCents: number;
  chargesCents: number;
  sharedChargesCents: number;
  savingsCents: number;
  remainingCents: number;
  chargesRatio: number | null;
  remainingDeltaCents: number;
  chargesDeltaCents: number;
}

export interface InsightItem {
  key: string;
  level: InsightLevel;
  message: string;
  link: string | null;
  amountCents: number;
}

export interface UpcomingItem {
  itemId: string;
  boardId: string;
  boardName: string;
  label: string;
  kind: ItemKind;
  dueDay: number | null;
  amountCents: number;
  tags: TagSummary[];
}

export interface SharedBoardInsightSummary {
  boardId: string;
  name: string;
  householdCents: number;
  myShareCents: number;
  contributionCents: number;
  balanceCents: number;
  summary: string | null;
}

export interface InsightsResponse {
  period: PeriodString;
  kpis: InsightKpis;
  insights: InsightItem[];
  upcoming: UpcomingItem[];
  sharedBoards: SharedBoardInsightSummary[];
}
