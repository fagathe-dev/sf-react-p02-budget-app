// frontend/src/ui/components/Navigation/Pagination/PaginationButton.tsx
import { ClickableComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';

export interface PaginationButtonProps
  extends ClickableComponentProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ClickableComponentProps> {
  isActive?: boolean;
}

const StyledButton = styled.button<{ $isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing[1.5]};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  border-radius: ${({ theme }) => theme.radii.base};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surface};
  color: ${({ theme }) => theme.colors.text.body};
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary.base};
    color: ${({ theme }) => theme.colors.primary.base};
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }

  ${({ $isActive, theme }) =>
    $isActive &&
    css`
      background-color: ${theme.colors.primary.base};
      border-color: ${theme.colors.primary.base};
      color: ${theme.colors.white};
      font-weight: ${theme.typography.weights.semibold};

      &:hover:not(:disabled) {
        background-color: ${theme.colors.primary.hover};
        border-color: ${theme.colors.primary.hover};
        color: ${theme.colors.white};
      }
    `}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const PaginationButton: React.FC<PaginationButtonProps> = ({
  isActive = false,
  type = 'button',
  children,
  ...rest
}) => {
  return (
    <StyledButton type={type} $isActive={isActive} aria-current={isActive ? 'page' : undefined} {...rest}>
      {children}
    </StyledButton>
  );
};
