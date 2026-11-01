import styled from 'styled-components';
import { FormElementBaseProps } from './form.types';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, FormElementBaseProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
}

export const Input = styled.input<InputProps>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text.body};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid
    ${({ validationState, theme }) => {
      if (validationState === 'invalid') return theme.colors.danger.base;
      if (validationState === 'valid') return theme.colors.success.base;
      return theme.colors.border.default;
    }};
  border-radius: ${({ theme }) => theme.radii.base};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus {
    outline: none;
    border-color: ${({ validationState, theme }) => {
      if (validationState === 'invalid') return theme.colors.danger.base;
      if (validationState === 'valid') return theme.colors.success.base;
      return theme.colors.primary.base;
    }};
    box-shadow: 0 0 0 3px
      ${({ validationState, theme }) => {
        if (validationState === 'invalid') return 'rgba(239, 68, 68, 0.2)';
        if (validationState === 'valid') return 'rgba(34, 197, 94, 0.2)';
        return theme.borders.focusRing.color;
      }};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
