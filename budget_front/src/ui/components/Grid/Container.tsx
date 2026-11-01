import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export interface ContainerProps extends BaseComponentProps {
  fluid?: boolean;
}

export const Container = styled.div.attrs<ContainerProps>((props) => ({
  as: props.as || 'div',
}))<ContainerProps>`
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: ${({ theme }) => theme.spacing[4]};
  padding-left: ${({ theme }) => theme.spacing[4]};

  ${({ fluid, theme }) =>
    !fluid &&
    css`
      ${theme.media.up('sm')} {
        max-width: 540px;
      }
      ${theme.media.up('md')} {
        max-width: 720px;
      }
      ${theme.media.up('lg')} {
        max-width: 960px;
      }
      ${theme.media.up('xl')} {
        max-width: 1140px;
      }
      ${theme.media.up('xxl')} {
        max-width: 1320px;
      }
    `}
`;
