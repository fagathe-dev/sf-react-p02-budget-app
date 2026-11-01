import styled from 'styled-components';
import { TypoBaseProps } from './typo.types';

export interface LeadProps extends TypoBaseProps {}

export const Lead = styled.p.attrs<LeadProps>((props) => ({
  as: props.as || 'p',
}))<LeadProps>`
  font-size: 1.25rem;
  font-weight: 300;
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  text-align: ${({ align }) => align || 'inherit'};
  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

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
        return theme.colors.text.muted;
    }
  }};
`;
