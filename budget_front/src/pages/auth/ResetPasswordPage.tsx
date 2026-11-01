import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { resetPassword } from '@/services/auth.api';
import { Button } from '@/ui/components/Base/Button';
import { Card } from '@/ui/components/Content/Card';
import { Alert } from '@/ui/components/Feedback/Alert';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { passwordSchema } from './authSchemas';

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Page ouverte depuis le lien de l'e-mail « mot de passe oublié » (/reset-password?token=…).
 */
export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [apiError, setApiError] = useState<string | null>(
    token ? null : 'Le lien de réinitialisation est incomplet. Faites une nouvelle demande.'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    setApiError(null);
    try {
      const { message } = await resetPassword({ token, password });
      setSuccessMessage(message);
    } catch (err) {
      const violations = getFieldErrors(err);
      if (violations.password) {
        setError('password', { message: violations.password });
      } else {
        setApiError(getErrorMessage(err, 'Erreur lors de la réinitialisation du mot de passe.'));
      }
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Nouveau mot de passe</Card.Title>
      </Card.Header>
      <Card.Body>
        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant="success">{successMessage}</Alert>
            <Button as={RouterLink} to="/login" fullWidth>
              Se connecter
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {apiError && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="danger">{apiError}</Alert>
              </div>
            )}

            <TextField
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
              error={errors.password?.message}
              {...register('password')}
            />

            <TextField
              label="Confirmer le mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Retapez votre mot de passe"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={isSubmitting} disabled={!token} fullWidth>
              Enregistrer le mot de passe
            </Button>
          </form>
        )}
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <RouterLink to="/forgot-password" style={{ color: 'inherit', fontWeight: 600 }}>
          Faire une nouvelle demande
        </RouterLink>
      </Card.Footer>
    </Card>
  );
};
