import { updatePassword } from '@/services/auth.api';
import { Button } from '@/ui/components/Base/Button';
import { Title } from '@/ui/components/Typo/Title';
import React, { useState } from 'react';
import * as S from './ProfileForms.styles';

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      const res = await updatePassword({ currentPassword, newPassword });
      setFeedback({ type: 'success', message: res.message || 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.FormCard onSubmit={handleSubmit}>
      <Title as="h4" style={{ margin: 0 }}>
        Modifier le mot de passe
      </Title>

      {feedback && <S.FeedbackMsg $type={feedback.type}>{feedback.message}</S.FeedbackMsg>}

      <S.FieldGroup>
        <S.Label htmlFor="current-password">Mot de passe actuel</S.Label>
        <S.Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </S.FieldGroup>

      <S.FieldGrid>
        <S.FieldGroup>
          <S.Label htmlFor="new-password">Nouveau mot de passe</S.Label>
          <S.Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </S.FieldGroup>

        <S.FieldGroup>
          <S.Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</S.Label>
          <S.Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </S.FieldGroup>
      </S.FieldGrid>

      <S.ActionsRow>
        <Button
          type="submit"
          loading={loading}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          Changer le mot de passe
        </Button>
      </S.ActionsRow>
    </S.FormCard>
  );
};