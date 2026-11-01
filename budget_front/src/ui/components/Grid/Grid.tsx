import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface GridProps extends BaseComponentProps {
  columns?: number | string;
  rows?: number | string;
  gap?: string;
  columnGap?: string;
  rowGap?: string;
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
}

export const Grid = styled.div.attrs<GridProps>((props) => ({
  as: props.as || 'div',
}))<GridProps>`
  display: grid;
  grid-template-columns: ${({ columns = 1 }) =>
    typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns};
  grid-template-rows: ${({ rows }) =>
    rows ? (typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows) : 'auto'};
  gap: ${({ gap, theme }) => gap || theme.spacing[0]};
  ${({ columnGap }) => columnGap && `column-gap: ${columnGap};`}
  ${({ rowGap }) => rowGap && `row-gap: ${rowGap};`}
  align-items: ${({ alignItems = 'stretch' }) => alignItems};
  justify-items: ${({ justifyItems = 'stretch' }) => justifyItems};
`;
