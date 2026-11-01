import { useAuthStore } from '@/stores/auth.store';
import { Loading } from '@/ui/components/Feedback/Loading';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LogoutPage = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return (
    <div style={{ display: 'grid', height: '100vh', placeItems: 'center' }}>
      <Loading size="lg" label="Déconnexion en cours…" />
    </div>
  );
};
