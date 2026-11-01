import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant;
  pill?: boolean;
  color?: string; // Hexcode direct pour les tags de l'utilisateur
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `2px ${theme.spacing[2]}`};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1.2;
  border-radius: ${({ pill, theme }) =>
    pill ? theme.radii.pill : theme.radii.sm};
  white-space: nowrap;

  ${({ color }) =>
    color &&
    css`
      background-color: ${color}20;
      color: ${color};
      border: 1px solid ${color}40;
    `}

  ${({ color, variant = 'neutral', theme }) => {
    if (color) return '';
    switch (variant) {
      case 'primary':
        return css`
          background-color: ${theme.colors.primary.subtle};
          color: ${theme.colors.primary.dark};
        `;
      case 'secondary':
        return css`
          background-color: ${theme.colors.secondary.subtle};
          color: ${theme.colors.secondary.dark};
        `;
      case 'danger':
        return css`
          background-color: ${theme.colors.danger.subtle};
          color: ${theme.colors.danger.dark};
        `;
      case 'success':
        return css`
          background-color: ${theme.colors.success.subtle};
          color: ${theme.colors.success.dark};
        `;
      case 'warning':
        return css`
          background-color: ${theme.colors.warning.subtle};
          color: ${theme.colors.warning.dark};
        `;
      case 'info':
        return css`
          background-color: ${theme.colors.info.subtle};
          color: ${theme.colors.info.dark};
        `;
      case 'neutral':
      default:
        return css`
          background-color: ${theme.colors.background.surfaceActive};
          color: ${theme.colors.text.muted};
        `;
    }
  }}
`;
