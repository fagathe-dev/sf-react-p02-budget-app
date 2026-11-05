import { getErrorMessage } from '@/services/apiError';
import { verifyEmail } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/ui/components';
import { Card } from '@/ui/components';
import { Alert } from '@/ui/components';
import { Loading } from '@/ui/components';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Page ouverte depuis le lien reçu à l'inscription (/verify-email?token=…) :
 * active le compte puis connecte automatiquement l'utilisateur.
 */
export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(token ? null : 'Le lien de vérification est incomplet.');
  // Le jeton est à usage unique : évite un second appel (StrictMode exécute les effets deux fois en dev)
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const { token: jwt, user } = await verifyEmail(token);
        useAuthStore.getState().setAuth(jwt, user);
        navigate('/', { replace: true });
      } catch (err) {
        setError(getErrorMessage(err, 'Ce lien de vérification est invalide ou a expiré.'));
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Vérification du compte</Card.Title>
      </Card.Header>
      <Card.Body>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant="danger">{error}</Alert>
            <Button href="/login" fullWidth>
              Se connecter pour recevoir un nouveau lien
            </Button>
          </div>
        ) : (
          <Loading size="lg" label="Activation de votre compte…" />
        )}
      </Card.Body>
    </Card>
  );
};
