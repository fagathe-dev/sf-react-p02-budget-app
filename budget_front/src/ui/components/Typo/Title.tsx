import styled from 'styled-components';
import { TypoBaseProps } from './typo.types';

export type TitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TitleProps extends TypoBaseProps {
  as?: TitleTag;
}

const titleSizes: Record<TitleTag, string> = {
  h1: '2.25rem',
  h2: '1.875rem',
  h3: '1.5rem',
  h4: '1.25rem',
  h5: '1.125rem',
  h6: '1rem',
};

export const Title = styled.h1.attrs<TitleProps>((props) => ({
  as: props.as || 'h3',
}))<TitleProps>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  text-align: ${({ align }) => align || 'inherit'};
  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  font-size: ${({ as = 'h3' }) => titleSizes[as as TitleTag]};

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
