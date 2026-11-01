import styled from 'styled-components';
import { FormElementBaseProps } from './form.types';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>, FormElementBaseProps {}

export const Select = styled.select<SelectProps>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  padding-right: ${({ theme }) => theme.spacing[6]};
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.borders.focusRing.color};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
