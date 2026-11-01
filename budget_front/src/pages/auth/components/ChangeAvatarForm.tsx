import { updateAvatar } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { Icon } from '@/ui/components/Base/Icon';
import { Text } from '@/ui/components/Typo/Text';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AvatarBox = styled.button`
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover || '#f3f4f6'};
  color: ${({ theme }) => theme.colors.text.heading};
  font-size: 24px;
  font-weight: 700;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover .overlay {
    opacity: 1;
  }
`;

const Overlay = styled.div.attrs({ className: 'overlay' })`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
`;

export const ChangeAvatarForm: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const initials = (user.username || user.email || '?').slice(0, 2).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const updatedUser = await updateAvatar(file);
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'avatar");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <Wrapper>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <AvatarBox
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        title="Changer la photo de profil"
      >
        {user.avatar ? <img src={user.avatar} alt={user.username} /> : <span>{initials}</span>}
        <Overlay>
          <Icon name={loading ? 'loading' : 'camera-outline'} size={22} />
        </Overlay>
      </AvatarBox>

      {error && (
        <Text size="xs" style={{ color: '#dc2626' }}>
          {error}
        </Text>
      )}
    </Wrapper>
  );
};