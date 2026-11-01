import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface ColumnsProps extends BaseComponentProps {
  count?: number;
  width?: string;
  gap?: string;
  rule?: string;
}

export const Columns = styled.div.attrs<ColumnsProps>((props) => ({
  as: props.as || 'div',
}))<ColumnsProps>`
  columns: ${({ count, width }) => {
    if (count && width) return `${count} ${width}`;
    if (count) return `${count}`;
    if (width) return width;
    return 'auto';
  }};
  column-gap: ${({ gap, theme }) => gap || theme.spacing[4]};
  ${({ rule }) => rule && `column-rule: ${rule};`}

  /* Empêche les cartes enfants de se couper en deux entre deux colonnes */
  & > * {
    break-inside: avoid;
    margin-bottom: ${({ gap, theme }) => gap || theme.spacing[4]};
  }
`;
