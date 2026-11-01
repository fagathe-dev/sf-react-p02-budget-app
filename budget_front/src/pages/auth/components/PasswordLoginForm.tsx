import { getErrorCode, getErrorMessage } from '@/services/apiError';
import { fetchLogin, resendVerificationEmail } from '@/services/auth.api';
import { AuthResponse } from '@/types/auth.types';
import { Button } from '@/ui/components/Base/Button';
import { Alert } from '@/ui/components/Feedback/Alert';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import { z } from 'zod';
import { identifierSchema } from '../authSchemas';

const EMAIL_NOT_VERIFIED = 'email_not_verified';

const loginSchema = z.object({
  username: identifierSchema,
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const ForgotRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: ${({ theme }) => `-${theme.spacing[1]} 0 ${theme.spacing[3]}`};
  font-size: ${({ theme }) => theme.typography.sizes.sm};

  a {
    color: inherit;
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

const AlertWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

interface PasswordLoginFormProps {
  onAuthenticated: (response: AuthResponse) => void;
}

export const PasswordLoginForm = ({ onAuthenticated }: PasswordLoginFormProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsNotVerified(false);
    setResendMessage(null);

    try {
      onAuthenticated(await fetchLogin(data));
    } catch (err) {
      setIsNotVerified(getErrorCode(err) === EMAIL_NOT_VERIFIED);
      setApiError(getErrorMessage(err, 'Erreur de connexion'));
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const { message } = await resendVerificationEmail(getValues('username').trim());
      setResendMessage(message);
    } catch (err) {
      setResendMessage(getErrorMessage(err, "Impossible de renvoyer l'e-mail de vérification."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {apiError && (
        <AlertWrapper>
          <Alert variant={isNotVerified ? 'warning' : 'danger'}>{resendMessage ?? apiError}</Alert>
          {isNotVerified && !resendMessage && (
            <Button type="button" variant="outline" size="sm" loading={isResending} onClick={handleResendVerification}>
              Renvoyer l'e-mail de vérification
            </Button>
          )}
        </AlertWrapper>
      )}

      <TextField
        label="E-mail ou nom d'utilisateur"
        type="text"
        autoComplete="username"
        placeholder="Ex : john@example.com ou johndoe"
        error={errors.username?.message}
        {...register('username')}
      />

      <TextField
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <ForgotRow>
        <RouterLink to="/forgot-password">Mot de passe oublié ?</RouterLink>
      </ForgotRow>

      <Button type="submit" loading={isSubmitting} fullWidth>
        Se connecter
      </Button>
    </form>
  );
};
