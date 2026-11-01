import styled, { css } from 'styled-components';
import { typography } from '@/ui/theme/tokens/typography';
import { TypoBaseProps } from './typo.types';

export type TextSize = keyof typeof typography.sizes | string;
export type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends TypoBaseProps {
  size?: TextSize;
  weight?: TextWeight;
}

const weightMap: Record<TextWeight, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const Text = styled.span.attrs<TextProps>((props) => ({
  as: props.as || 'span',
}))<TextProps>`
  text-align: ${({ align }) => align || 'inherit'};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  font-weight: ${({ weight = 'normal' }) => weightMap[weight]};

  font-size: ${({ size = 'base', theme }) => {
    if (size in theme.typography.sizes) {
      return theme.typography.sizes[size as keyof typeof theme.typography.sizes];
    }
    return size;
  }};

  ${({ as, theme }) =>
    as === 'pre' &&
    css`
      font-family: ${theme.typography.fonts.mono};
      margin: 0;
    `}

  color: ${({ color, as, theme }) => {
    if (color) {
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
      }
    }

    return as === 'p' ? theme.colors.text.muted : theme.colors.text.body;
  }};
`;