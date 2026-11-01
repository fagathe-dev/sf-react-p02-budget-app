import styled from 'styled-components';
import { ValidationState } from './form.types';

export interface HelperTextProps {
  state?: ValidationState;
}

export const HelperText = styled.span<HelperTextProps>`
  display: block;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  margin-top: ${({ theme }) => theme.spacing[1]};
  color: ${({ state, theme }) => {
    switch (state) {
      case 'invalid':
        return theme.colors.danger.base;
      case 'valid':
        return theme.colors.success.base;
      default:
        return theme.colors.text.muted;
    }
  }};
`;