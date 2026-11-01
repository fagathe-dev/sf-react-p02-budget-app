import { updateEmail } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/ui/components/Base/Button';
import { Title } from '@/ui/components/Typo/Title';
import React, { useState } from 'react';
import * as S from './ProfileForms.styles';

export const ChangeEmailForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email.trim() === user?.email) return;

    try {
      setLoading(true);
      setFeedback(null);
      // L'adresse n'est modifiée qu'après le clic sur le lien reçu (voir ConfirmEmailChangePage)
      const { message } = await updateEmail({ email: email.trim() });
      setFeedback({ type: 'success', message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : "Impossible de modifier l'adresse e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.FormCard onSubmit={handleSubmit}>
      <Title as="h4" style={{ margin: 0 }}>
        Adresse e-mail
      </Title>

      {feedback && <S.FeedbackMsg $type={feedback.type}>{feedback.message}</S.FeedbackMsg>}

      <S.FieldGroup>
        <S.Label htmlFor="profile-email">Nouvelle adresse e-mail</S.Label>
        <S.Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </S.FieldGroup>

      <S.ActionsRow>
        <Button type="submit" loading={loading} disabled={!email.trim() || email.trim() === user?.email}>
          Mettre à jour l'e-mail
        </Button>
      </S.ActionsRow>
    </S.FormCard>
  );
};
