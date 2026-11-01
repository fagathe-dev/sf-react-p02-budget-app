import { getErrorMessage } from '@/services/apiError';
import { loginWithCode, requestLoginCode } from '@/services/auth.api';
import { AuthResponse } from '@/types/auth.types';
import { Button } from '@/ui/components/Base/Button';
import { Alert } from '@/ui/components/Feedback/Alert';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Text } from '@/ui/components/Typo/Text';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { identifierSchema, loginCodeSchema } from '../authSchemas';

const identifierFormSchema = z.object({ username: identifierSchema });
const codeFormSchema = z.object({ code: loginCodeSchema });

type IdentifierFormData = z.infer<typeof identifierFormSchema>;
type CodeFormData = z.infer<typeof codeFormSchema>;

interface PendingCode {
  username: string;
  /** Timestamps (ms) d'expiration du code et de disponibilité d'un nouvel envoi */
  expiresAt: number;
  resendAt: number;
}

const AlertWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

const formatDuration = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const secondsUntil = (timestamp: number, now: number): number => Math.max(0, Math.ceil((timestamp - now) / 1000));

/** Horodatage courant, lu uniquement dans les gestionnaires d'événements (jamais pendant le rendu) */
const currentTimestamp = (): number => Date.now();

interface CodeLoginFormProps {
  onAuthenticated: (response: AuthResponse) => void;
}

export const CodeLoginForm = ({ onAuthenticated }: CodeLoginFormProps) => {
  const [pending, setPending] = useState<PendingCode | null>(null);
  const [now, setNow] = useState(currentTimestamp);
  const [info, setInfo] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierFormSchema),
    defaultValues: { username: '' },
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: '' },
  });

  // Rafraîchit les comptes à rebours tant qu'un code est en attente
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(() => setNow(currentTimestamp()), 1000);
    return () => clearInterval(interval);
  }, [pending]);

  const sendCode = async (username: string) => {
    const response = await requestLoginCode(username);
    const sentAt = currentTimestamp();

    setNow(sentAt);
    setPending({
      username,
      expiresAt: sentAt + response.expiresIn * 1000,
      resendAt: sentAt + response.resendAvailable * 1000,
    });
    setInfo(response.message);
    codeForm.reset({ code: '' });
  };

  const onRequestCode = async ({ username }: IdentifierFormData) => {
    setApiError(null);
    try {
      await sendCode(username.trim());
    } catch (err) {
      setApiError(getErrorMessage(err, "Impossible d'envoyer le code de connexion."));
    }
  };

  const onSubmitCode = async ({ code }: CodeFormData) => {
    if (!pending) return;
    setApiError(null);
    try {
      onAuthenticated(await loginWithCode({ username: pending.username, code: code.trim() }));
    } catch (err) {
      codeForm.reset({ code: '' });
      setApiError(getErrorMessage(err, 'Code invalide ou expiré.'));
    }
  };

  const handleResend = async () => {
    if (!pending) return;
    setApiError(null);
    try {
      setIsResending(true);
      await sendCode(pending.username);
    } catch (err) {
      setApiError(getErrorMessage(err, "Impossible d'envoyer le code de connexion."));
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeIdentifier = () => {
    setPending(null);
    setInfo(null);
    setApiError(null);
  };

  if (!pending) {
    const { register, handleSubmit, formState } = identifierForm;

    return (
      <form onSubmit={handleSubmit(onRequestCode)} noValidate>
        {apiError && (
          <AlertWrapper>
            <Alert variant="danger">{apiError}</Alert>
          </AlertWrapper>
        )}

        <TextField
          label="E-mail ou nom d'utilisateur"
          type="text"
          autoComplete="username"
          placeholder="Ex : john@example.com ou johndoe"
          hint="Un code à usage unique, valable 1 min 30, vous sera envoyé par e-mail."
          error={formState.errors.username?.message}
          {...register('username')}
        />

        <Button type="submit" loading={formState.isSubmitting} fullWidth>
          Recevoir un code de connexion
        </Button>
      </form>
    );
  }

  const { register, handleSubmit, formState } = codeForm;
  const expiresIn = secondsUntil(pending.expiresAt, now);
  const resendIn = secondsUntil(pending.resendAt, now);

  return (
    <form onSubmit={handleSubmit(onSubmitCode)} noValidate>
      <AlertWrapper>
        {apiError ? (
          <Alert variant="danger">{apiError}</Alert>
        ) : expiresIn === 0 ? (
          <Alert variant="warning">Le code a expiré. Demandez-en un nouveau.</Alert>
        ) : (
          info && <Alert variant="info">{info}</Alert>
        )}
      </AlertWrapper>

      <TextField
        label="Code de connexion"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        hint={expiresIn > 0 ? `Expire dans ${formatDuration(expiresIn)}` : undefined}
        error={formState.errors.code?.message}
        {...register('code')}
      />

      <Button type="submit" loading={formState.isSubmitting} disabled={expiresIn === 0} fullWidth>
        Se connecter
      </Button>

      <Actions>
        <Button type="button" variant="ghost" size="sm" onClick={handleChangeIdentifier}>
          Changer d'identifiant
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={isResending}
          disabled={resendIn > 0 || isResending}
          onClick={handleResend}
        >
          {resendIn > 0 ? `Renvoyer le code (${resendIn}s)` : 'Renvoyer le code'}
        </Button>
      </Actions>

      <Text size="xs" color="muted" style={{ marginTop: 12 }}>
        Code envoyé pour <strong>{pending.username}</strong>.
      </Text>
    </form>
  );
};
