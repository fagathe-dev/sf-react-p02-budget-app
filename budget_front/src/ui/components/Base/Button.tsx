import { ClickableComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'ghost'
  | 'outline';

export type ButtonSize = 'sm' | 'base' | 'lg';

export interface ButtonProps extends ClickableComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2.5]}`};
    font-size: ${({ theme }) => theme.typography.sizes.xs};
    height: 28px;
  `,
  base: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    height: 36px;
  `,
  lg: css`
    padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[5]}`};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    height: 44px;
  `,
};

export const Button = styled.button
  .withConfig({
    shouldForwardProp: (prop) => prop !== 'loading',
  })
  .attrs<ButtonProps>((props) => ({
    type: props.type || 'button',
  }))<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: inherit;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  border-radius: ${({ theme }) => theme.radii.base};
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
  &:hover,
  &:focus,
  &:active {
    text-decoration: none;
  }
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  ${({ size = 'base' }) => sizeStyles[size]}

  ${({ variant = 'primary', theme }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background-color: ${theme.colors.secondary.base};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.secondary.hover};
          }
        `;
      case 'tertiary':
        return css`
          background-color: ${theme.colors.tertiary.base};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.tertiary.hover};
          }
        `;
      case 'danger':
        return css`
          background-color: ${theme.colors.danger.base};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.danger.hover};
          }
        `;
      case 'outline':
        return css`
          background-color: transparent;
          border-color: ${theme.colors.border.default};
          color: ${theme.colors.text.body};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.background.surfaceHover};
            border-color: ${theme.colors.border.hover};
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          color: ${theme.colors.text.body};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.background.surfaceHover};
          }
        `;
      case 'primary':
      default:
        return css`
          background-color: ${theme.colors.primary.base};
          color: ${theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary.hover};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ loading }) =>
    loading &&
    css`
      pointer-events: none;
      opacity: 0.7;
    `}
`;
