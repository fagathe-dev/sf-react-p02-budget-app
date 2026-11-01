import { useAuthStore } from '@/stores/auth.store';
import { AuthResponse } from '@/types/auth.types';
import { SegmentedControl } from '@/ui/components/Base/SegmentedControl';
import { Card } from '@/ui/components/Content/Card';
import { Text } from '@/ui/components/Typo/Text';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CodeLoginForm, PasswordLoginForm } from './components';

type LoginMode = 'password' | 'code';

const LOGIN_MODES: Array<{ value: LoginMode; label: string; icon: string }> = [
  { value: 'password', label: 'Mot de passe', icon: 'lock-outline' },
  { value: 'code', label: 'Code par e-mail', icon: 'email-fast-outline' },
];

const ModeSwitcher = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const LoginPage = () => {
  const [mode, setMode] = useState<LoginMode>('password');
  const { setAuth, token, user } = useAuthStore();
  const navigate = useNavigate();

  // Redirection automatique si une session valide est déjà active
  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  const handleAuthenticated = ({ token, user }: AuthResponse) => {
    setAuth(token, user);
    navigate('/');
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Connexion</Card.Title>
      </Card.Header>
      <Card.Body>
        <ModeSwitcher>
          <SegmentedControl
            aria-label="Mode de connexion"
            options={LOGIN_MODES}
            value={mode}
            onChange={setMode}
            fullWidth
          />
        </ModeSwitcher>

        {mode === 'password' ? (
          <PasswordLoginForm onAuthenticated={handleAuthenticated} />
        ) : (
          <CodeLoginForm onAuthenticated={handleAuthenticated} />
        )}
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          Pas encore de compte ?{' '}
          <RouterLink to="/register" style={{ color: 'inherit', fontWeight: 600 }}>
            Créer un compte
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
