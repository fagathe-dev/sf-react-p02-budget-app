import styled from 'styled-components';
import { TypoBaseProps } from './typo.types';

export type DisplayLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface DisplayProps extends TypoBaseProps {
  level?: DisplayLevel;
}

const displaySizes: Record<DisplayLevel, string> = {
  1: '5rem',
  2: '4.5rem',
  3: '4rem',
  4: '3.5rem',
  5: '3rem',
  6: '2.5rem',
};

export const Display = styled.h1.attrs<DisplayProps>((props) => ({
  as: props.as || 'h1',
}))<DisplayProps>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: 300;
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  text-align: ${({ align }) => align || 'inherit'};
  font-size: ${({ level = 1 }) => displaySizes[level]};
  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  letter-spacing: -0.02em;

  color: ${({ color, theme }) => {
    switch (color) {
      case 'primary':
        return theme.colors.primary.base;
      case 'secondary':
        return theme.colors.secondary.base;
      case 'tertiary':
        return theme.colors.tertiary.base;
      case 'success':
        return theme.colors.success.base;
      case 'warning':
        return theme.colors.warning.base;
      case 'info':
        return theme.colors.info.base;
      case 'danger':
        return theme.colors.danger.base;
      case 'muted':
        return theme.colors.text.muted;
      default:
        return theme.colors.text.heading;
    }
  }};
`;