import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface FlexProps extends BaseComponentProps {
  inline?: boolean;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;
}

export const Flex = styled.div.attrs<FlexProps>((props) => ({
  as: props.as || 'div',
}))<FlexProps>`
  display: ${({ inline }) => (inline ? 'inline-flex' : 'flex')};
  flex-direction: ${({ direction = 'row' }) => direction};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  align-items: ${({ align = 'stretch' }) => align};
  flex-wrap: ${({ wrap = 'nowrap' }) => wrap};
  gap: ${({ gap, theme }) => gap || theme.spacing[0]};
`;
