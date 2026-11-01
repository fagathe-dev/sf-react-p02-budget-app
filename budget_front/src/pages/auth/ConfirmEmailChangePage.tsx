import { getErrorMessage } from '@/services/apiError';
import { confirmEmailChange } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/ui/components/Base/Button';
import { Card } from '@/ui/components/Content/Card';
import { Alert } from '@/ui/components/Feedback/Alert';
import { Loading } from '@/ui/components/Feedback/Loading';
import { Title } from '@/ui/components/Typo/Title';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

type Status = { type: 'loading' } | { type: 'success' | 'error'; message: string };

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[6]};
`;

/**
 * Page ouverte depuis le lien de l'e-mail de changement d'adresse (/confirm-email-change?token=…).
 * Accessible connecté ou non : le jeton suffit à valider la demande.
 */
export const ConfirmEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const authToken = useAuthStore((state) => state.token);

  const [status, setStatus] = useState<Status>(() =>
    token ? { type: 'loading' } : { type: 'error', message: 'Le lien de confirmation est incomplet.' }
  );
  // Le jeton est à usage unique : évite un second appel (StrictMode exécute les effets deux fois en dev)
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (!token || hasConfirmed.current) return;
    hasConfirmed.current = true;

    const confirm = async () => {
      try {
        const res = await confirmEmailChange(token);
        setStatus({ type: 'success', message: res.message });

        // Session ouverte sur le même compte : met à jour l'e-mail affiché (état lu à la réponse)
        const { user, setUser } = useAuthStore.getState();
        if (user && res.user.id === user.id) {
          setUser(res.user);
        }
      } catch (err) {
        setStatus({ type: 'error', message: getErrorMessage(err, 'Le lien de confirmation est invalide ou a expiré.') });
      }
    };

    confirm();
  }, [token]);

  return (
    <Card>
      <Body>
        <Title as="h3" style={{ margin: 0 }}>
          Changement d'adresse e-mail
        </Title>

        {status.type === 'loading' ? (
          <Loading size="lg" label="Validation de votre nouvelle adresse…" />
        ) : (
          <Alert variant={status.type === 'success' ? 'success' : 'danger'}>{status.message}</Alert>
        )}

        {status.type !== 'loading' && (
          <Button as={Link} to={authToken ? '/profile' : '/login'} fullWidth>
            {authToken ? 'Retour à mon profil' : 'Se connecter'}
          </Button>
        )}
      </Body>
    </Card>
  );
};
