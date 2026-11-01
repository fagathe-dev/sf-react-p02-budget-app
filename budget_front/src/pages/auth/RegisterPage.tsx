import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { fetchRegister, resendVerificationEmail } from '@/services/auth.api';
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
import { passwordSchema } from './authSchemas';

const registerSchema = z
  .object({
    email: z
      .email("Format d'e-mail invalide")
      .min(1, "L'adresse e-mail est obligatoire"),
    username: z
      .string()
      .trim()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(90, "Le nom d'utilisateur doit contenir au maximum 90 caractères"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  // Inscription réussie : le compte doit être vérifié via le lien reçu par e-mail avant connexion
  const [registered, setRegistered] = useState<{ email: string; message: string } | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const { message } = await fetchRegister({
        email: data.email,
        username: data.username,
        password: data.password,
      });

      setRegistered({ email: data.email, message });
    } catch (err) {
      const violations = getFieldErrors(err);
      const fields = ['email', 'username', 'password'] as const;
      const fieldViolations = fields.filter((field) => violations[field]);
      fieldViolations.forEach((field) => setError(field, { message: violations[field] }));

      // Message global uniquement si aucune erreur n'est rattachée à un champ du formulaire
      if (fieldViolations.length === 0) {
        setApiError(getErrorMessage(err, "Erreur lors de l'inscription"));
      }
    }
  };

  const handleResend = async () => {
    if (!registered) return;
    try {
      setIsResending(true);
      const { message } = await resendVerificationEmail(registered.email);
      setResendMessage(message);
    } catch (err) {
      setResendMessage(getErrorMessage(err, "Impossible de renvoyer l'e-mail de vérification."));
    } finally {
      setIsResending(false);
    }
  };

  if (registered) {
    return (
      <Card elevation="sm">
        <Card.Header>
          <Card.Title>Vérifiez votre boîte mail</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant="success">{registered.message}</Alert>
            <Text size="sm" color="muted">
              Cliquez sur le lien reçu pour activer votre compte : vous serez connecté automatiquement. Pensez à
              vérifier vos courriers indésirables.
            </Text>
            {resendMessage ? (
              <Alert variant="info">{resendMessage}</Alert>
            ) : (
              <Button type="button" variant="outline" loading={isResending} onClick={handleResend} fullWidth>
                Renvoyer l'e-mail de vérification
              </Button>
            )}
          </div>
        </Card.Body>
        <Card.Footer style={{ justifyContent: 'center' }}>
          <RouterLink to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
            Retour à la connexion
          </RouterLink>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card elevation="sm">
      <Card.Header>
        <Card.Title>Créer un compte</Card.Title>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger">{apiError}</Alert>
            </div>
          )}

          <TextField
            label="Adresse e-mail"
            type="email"
            placeholder="Ex : john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <TextField
            label="Nom d'utilisateur"
            type="text"
            placeholder="Ex : john_doe"
            error={errors.username?.message}
            {...register('username')}
          />

          <TextField
            label="Mot de passe"
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

          <Button type="submit" loading={isSubmitting} fullWidth>
            S'inscrire
          </Button>
        </form>
      </Card.Body>
      <Card.Footer style={{ justifyContent: 'center' }}>
        <Text size="sm">
          Déjà inscrit ?{' '}
          <RouterLink to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
            Se connecter
          </RouterLink>
        </Text>
      </Card.Footer>
    </Card>
  );
};
