import { BaseComponentProps } from '@/ui/types';
import { useState } from 'react';
import styled from 'styled-components';

export type AvatarSize = 'sm' | 'base' | 'lg';

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
}

const avatarSizes = {
  sm: '28px',
  base: '36px',
  lg: '48px',
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
};

const AvatarContainer = styled.div<{ size: AvatarSize }>`
  width: ${({ size }) => avatarSizes[size]};
  height: ${({ size }) => avatarSizes[size]};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.tertiary.subtle};
  color: ${({ theme }) => theme.colors.tertiary.dark};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ size }) => (size === 'sm' ? '0.75rem' : size === 'lg' ? '1.125rem' : '0.875rem')};
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
  box-shadow: ${({ theme }) => theme.shadows['md']};
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Avatar = ({ src, alt = '', name, size = 'base', ...rest }: AvatarProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <AvatarContainer size={size} {...rest}>
      {src && !hasError ? (
        <AvatarImage src={src} alt={alt || name || 'Avatar'} onError={() => setHasError(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </AvatarContainer>
  );
};
