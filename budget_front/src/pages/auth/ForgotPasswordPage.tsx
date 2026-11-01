import { getErrorMessage } from '@/services/apiError';
import { requestPasswordReset } from '@/services/auth.api';
import { Button } from '@/ui/components/Base/Button';
import { Card } from '@/ui/components/Content/Card';
import { Alert } from '@/ui/components/Feedback/Alert';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Text } from '@/ui/components/Typo/Text';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.email("Format d'e-mail invalide").min(1, "L'adresse e-mail est obligatoire"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      const { message } = await requestPasswordReset(email.trim());
      setSuccessMessage(message);
    } catch (err) {
      setApiError(getErrorMessage(err, 'Impossible de traiter la demande de réinitialisation.'));
    }
  };

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Mot de passe oublié</Card.Title>
      </Card.Header>
      <Card.Body>
        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant="success">{successMessage}</Alert>
            <Text size="sm" color="muted">
              Le lien est valable 24 heures et ne peut être utilisé qu'une seule fois. Pensez à vérifier vos courriers
              indésirables.
            </Text>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {apiError && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="danger">{apiError}</Alert>
              </div>
            )}

            <TextField
              label="Adresse e-mail"
              type="email"
              autoComplete="email"
              placeholder="Ex : john@example.com"
              hint="Saisissez l'adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe."
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" loading={isSubmitting} fullWidth>
              Envoyer le lien de réinitialisation
            </Button>
          </form>
        )}
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <RouterLink to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
          Retour à la connexion
        </RouterLink>
      </Card.Footer>
    </Card>
  );
};
