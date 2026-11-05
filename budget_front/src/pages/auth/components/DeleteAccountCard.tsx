import { getErrorMessage } from '@/services/apiError';
import { deleteAccount, requestAccountDeletion } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/ui/components';
import { Alert } from '@/ui/components';
import { TextField } from '@/ui/components';
import { Text } from '@/ui/components';
import { Title } from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { z } from 'zod';
import { loginCodeSchema } from '../authSchemas';

const codeFormSchema = z.object({ code: loginCodeSchema });
type CodeFormData = z.infer<typeof codeFormSchema>;

interface PendingCode {
  /** Timestamps (ms) d'expiration du code et de disponibilité d'un nouvel envoi */
  expiresAt: number;
  resendAt: number;
}

const DangerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  border: 1px solid #fecaca;
  background-color: #fef2f2;
  border-radius: ${({ theme }) => theme.radii.base};
  max-width: 640px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const DANGER_BUTTON_STYLE = { backgroundColor: '#dc2626', color: '#fff', border: 'none' };

const formatDuration = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const secondsUntil = (timestamp: number, now: number): number => Math.max(0, Math.ceil((timestamp - now) / 1000));

/** Horodatage courant, lu uniquement dans les gestionnaires d'événements (jamais pendant le rendu) */
const currentTimestamp = (): number => Date.now();

/**
 * Suppression définitive du compte en deux étapes : envoi d'un code par e-mail (10 min), puis saisie du code.
 */
export const DeleteAccountCard = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [pending, setPending] = useState<PendingCode | null>(null);
  const [now, setNow] = useState(currentTimestamp);
  const [info, setInfo] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: '' },
  });

  // Rafraîchit les comptes à rebours tant qu'un code est en attente
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => setNow(currentTimestamp()), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const sendCode = async () => {
    setApiError(null);
    try {
      setIsRequesting(true);
      const response = await requestAccountDeletion();
      const sentAt = currentTimestamp();

      setNow(sentAt);
      setPending({
        expiresAt: sentAt + response.expiresIn * 1000,
        resendAt: sentAt + response.resendAvailable * 1000,
      });
      setInfo(response.message);
      reset({ code: '' });
    } catch (err) {
      setApiError(getErrorMessage(err, "Impossible d'envoyer le code de confirmation."));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleStart = () => {
    const confirmed = window.confirm(
      'Attention : la suppression de votre compte est définitive. Toutes vos données et vos fichiers seront supprimés. Recevoir un code de confirmation par e-mail ?'
    );
    if (confirmed) sendCode();
  };

  const handleCancel = () => {
    setPending(null);
    setInfo(null);
    setApiError(null);
  };

  const onSubmit = async ({ code }: CodeFormData) => {
    setApiError(null);
    try {
      await deleteAccount(code.trim());
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      reset({ code: '' });
      setApiError(getErrorMessage(err, 'Erreur lors de la suppression du compte.'));
    }
  };

  const expiresIn = pending ? secondsUntil(pending.expiresAt, now) : 0;
  const resendIn = pending ? secondsUntil(pending.resendAt, now) : 0;

  return (
    <DangerCard>
      <Header>
        <div style={{ maxWidth: 420 }}>
          <Title as="h4" style={{ margin: 0, color: '#991b1b' }}>
            Supprimer définitivement le compte
          </Title>
          <Text size="xs" style={{ color: '#b91c1c', marginTop: 4 }}>
            Cette action est irréversible et supprimera toutes vos données ainsi que vos fichiers stockés sur le
            serveur. Un code de confirmation vous sera envoyé par e-mail.
          </Text>
        </div>

        {!pending && (
          <Button type="button" loading={isRequesting} onClick={handleStart} style={DANGER_BUTTON_STYLE}>
            Supprimer mon compte
          </Button>
        )}
      </Header>

      {apiError && <Alert variant="danger">{apiError}</Alert>}

      {pending && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {!apiError &&
            (expiresIn === 0 ? (
              <Alert variant="warning">Le code a expiré. Demandez-en un nouveau.</Alert>
            ) : (
              info && <Alert variant="info">{info}</Alert>
            ))}

          <div style={{ marginTop: 12 }}>
            <TextField
              label="Code de confirmation"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              hint={expiresIn > 0 ? `Expire dans ${formatDuration(expiresIn)}` : undefined}
              error={errors.code?.message}
              {...register('code')}
            />
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={expiresIn === 0}
            fullWidth
            style={DANGER_BUTTON_STYLE}
          >
            Confirmer la suppression définitive
          </Button>

          <Actions style={{ marginTop: 12 }}>
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={isRequesting}
              disabled={resendIn > 0 || isRequesting}
              onClick={sendCode}
            >
              {resendIn > 0 ? `Renvoyer le code (${resendIn}s)` : 'Renvoyer le code'}
            </Button>
          </Actions>
        </form>
      )}
    </DangerCard>
  );
};
