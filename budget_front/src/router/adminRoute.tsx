import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Restreint l'accès aux utilisateurs ROLE_ADMIN.
 * À placer sous ProtectedRoute : la session (et donc user.role) est déjà chargée.
 */
export const AdminRoute = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
