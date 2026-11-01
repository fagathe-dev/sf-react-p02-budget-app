import { PeriodString } from '@/types/budget.types';

export const ROUTES = {
  HOME: '/',
  INSIGHTS: '/insights',
  BOARDS: '/boards',
  BOARD_DETAIL: '/boards/:boardId',
  EXPENSE_GROUPS: '/expense-groups',
  EXPENSE_GROUP_DETAIL: '/expense-groups/:groupId',
  TAGS: '/tags',
  INVITATION: '/invitations/:token',
  PROFILE: '/profile',
  LOGOUT: '/logout',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  RESET_PASSWORD: '/reset-password',
  CONFIRM_EMAIL_CHANGE: '/confirm-email-change',
  ADMIN: '/admin',
  ADMIN_EMAILS: '/admin/emails',
  ADMIN_LOGS: '/admin/logs',
} as const;

/** Construit l'URL d'un board (alignée sur les liens `/boards/{id}?month=AAAA-MM` de l'API) */
export const buildBoardPath = (boardId: string, month?: PeriodString): string => {
  const base = `/boards/${encodeURIComponent(boardId)}`;
  return month ? `${base}?month=${encodeURIComponent(month)}` : base;
};

/** Construit l'URL d'un groupe de dépenses ExpenseSplitter */
export const buildExpenseGroupPath = (groupId: string): string =>
  `/expense-groups/${encodeURIComponent(groupId)}`;

/** Construit l'URL d'une invitation (`/invitations/{token}`) */
export const buildInvitationPath = (token: string): string =>
  `/invitations/${encodeURIComponent(token)}`;
