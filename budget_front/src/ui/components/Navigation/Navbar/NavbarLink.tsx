import { ClickableComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export interface NavbarLinkProps extends ClickableComponentProps {
  active?: boolean;
}

export const NavbarLink = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.base};
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.base : theme.colors.text.body};

  ${({ $active, theme }) =>
    $active
      ? css`
          background-color: ${theme.colors.primary.subtle};
        `
      : css`
          &:hover:not(:disabled) {
            background-color: ${theme.colors.background.surfaceHover};
            color: ${theme.colors.text.heading};
          }
        `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
