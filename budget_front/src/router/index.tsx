import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  BoardDetailPage,
  BoardsPage,
  ConfirmEmailChangePage,
  EmailPreviewPage,
  ExpenseGroupDetailPage,
  ExpenseGroupsPage,
  ForgotPasswordPage,
  InsightsPage,
  InvitationPage,
  LoginPage,
  LogoutPage,
  LogsPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  TagsPage,
  VerifyEmailPage,
} from '@/pages';
import { AdminRoute } from '@/router/adminRoute';
import { ProtectedRoute } from '@/router/protectedRoute';
import { PublicRoute } from '@/router/publicRoute';
import { ROUTES } from '@/router/routes';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export * from './adminRoute';
export * from './protectedRoute';
export * from './publicRoute';
export * from './routes';

export const router = createBrowserRouter([
  // 1. Espace connecté (Sidebar Dashboard via AppLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.LOGOUT,
        element: <LogoutPage />,
      },
      {
        element: <AppLayout />,
        children: [
          // Accueil (Insights)
          {
            path: ROUTES.HOME,
            element: <InsightsPage />,
          },
          {
            path: ROUTES.INSIGHTS,
            element: <Navigate to={ROUTES.HOME} replace />,
          },

          // Module Budget (Boards & Tags)
          {
            path: ROUTES.BOARDS,
            element: <BoardsPage />,
          },
          {
            path: ROUTES.BOARD_DETAIL,
            element: <BoardDetailPage />,
          },
          {
            path: ROUTES.TAGS,
            element: <TagsPage />,
          },

          // Module ExpenseSplitter (Groupes de dépenses)
          {
            path: ROUTES.EXPENSE_GROUPS,
            element: <ExpenseGroupsPage />,
          },
          {
            path: ROUTES.EXPENSE_GROUP_DETAIL,
            element: <ExpenseGroupDetailPage />,
          },

          // Gestion du compte & profil
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },

          // Administration (ROLE_ADMIN)
          {
            path: ROUTES.ADMIN,
            element: <AdminRoute />,
            children: [
              { index: true, element: <Navigate to={ROUTES.ADMIN_EMAILS} replace /> },
              { path: 'emails', element: <EmailPreviewPage /> },
              { path: 'logs', element: <LogsPage /> },
            ],
          },
        ],
      },
    ],
  },

  // 2. Espace public (Connexion & Inscription)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.REGISTER,
            element: <RegisterPage />,
          },
          {
            path: ROUTES.FORGOT_PASSWORD,
            element: <ForgotPasswordPage />,
          },
        ],
      },
    ],
  },

  // 3. Liens reçus par e-mail ou partagés : accessibles connecté ou non (le jeton fait foi)
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.CONFIRM_EMAIL_CHANGE,
        element: <ConfirmEmailChangePage />,
      },
      {
        path: ROUTES.VERIFY_EMAIL,
        element: <VerifyEmailPage />,
      },
      {
        path: ROUTES.RESET_PASSWORD,
        element: <ResetPasswordPage />,
      },
      {
        path: ROUTES.INVITATION,
        element: <InvitationPage />,
      },
    ],
  },

  // 4. Fallback 404
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);
