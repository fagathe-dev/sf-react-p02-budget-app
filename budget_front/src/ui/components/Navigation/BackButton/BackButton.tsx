import { Icon } from '@/ui/components/Base/Icon';
import { ClickableComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

const StyledBackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[2.5]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.base};
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text.heading};
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export interface BackButtonProps extends ClickableComponentProps {
  label?: string;
  fallbackUrl?: string;
}

export const BackButton = ({
  label = 'Retour',
  fallbackUrl,
  onClick,
  ...rest
}: BackButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }

    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else if (fallbackUrl) {
        window.location.href = fallbackUrl;
      }
    }
  };

  return (
    <StyledBackButton type="button" onClick={handleClick} {...rest}>
      <Icon name="arrow-left" size={18} />
      {label && <span>{label}</span>}
    </StyledBackButton>
  );
};
