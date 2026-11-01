import styled, { css } from 'styled-components';
import { CellProps } from './table.types';

const cellShared = css<CellProps>`
  padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[3]}`};
  text-align: ${({ align = 'left' }) => align};
  ${({ width }) =>
    width && `width: ${typeof width === 'number' ? `${width}px` : width};`}
`;

export const Td = styled.td<
  CellProps & React.TdHTMLAttributes<HTMLTableCellElement>
>`
  ${cellShared}
`;
