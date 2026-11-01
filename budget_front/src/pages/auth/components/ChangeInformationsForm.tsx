import { updateProfile } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/ui/components/Base/Button';
import { Title } from '@/ui/components/Typo/Title';
import React, { useState } from 'react';
import * as S from './ProfileForms.styles';

export const ChangeInformationsForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [username, setUsername] = useState(user?.username || '');
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setLoading(true);
      setFeedback(null);
      const updated = await updateProfile({
        username: username.trim(),
        firstname: firstname.trim() || null,
        lastname: lastname.trim() || null,
      });
      setUser(updated);
      setFeedback({ type: 'success', message: 'Informations mises à jour avec succès.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.FormCard onSubmit={handleSubmit}>
      <Title as="h4" style={{ margin: 0 }}>
        Informations personnelles
      </Title>

      {feedback && <S.FeedbackMsg $type={feedback.type}>{feedback.message}</S.FeedbackMsg>}

      <S.FieldGroup>
        <S.Label htmlFor="profile-username">Nom d'utilisateur *</S.Label>
        <S.Input
          id="profile-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={90}
        />
      </S.FieldGroup>

      <S.FieldGrid>
        <S.FieldGroup>
          <S.Label htmlFor="profile-firstname">Prénom</S.Label>
          <S.Input
            id="profile-firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            placeholder="Votre prénom"
            maxLength={80}
          />
        </S.FieldGroup>

        <S.FieldGroup>
          <S.Label htmlFor="profile-lastname">Nom</S.Label>
          <S.Input
            id="profile-lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            placeholder="Votre nom"
            maxLength={80}
          />
        </S.FieldGroup>
      </S.FieldGrid>

      <S.ActionsRow>
        <Button type="submit" loading={loading} disabled={!username.trim()}>
          Enregistrer les modifications
        </Button>
      </S.ActionsRow>
    </S.FormCard>
  );
};
