import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Loading } from '@/ui/components/Feedback/Loading';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', height: '100vh', placeItems: 'center' }}>
        <Loading size="lg" label="Vérification de la session…" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};