import styled, { css } from 'styled-components';
import { CellProps } from './table.types';

const cellShared = css<CellProps>`
  padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[3]}`};
  text-align: ${({ align = 'left' }) => align};
  ${({ width }) =>
    width && `width: ${typeof width === 'number' ? `${width}px` : width};`}
`;

export const Th = styled.th<
  CellProps & React.ThHTMLAttributes<HTMLTableCellElement>
>`
  ${cellShared}
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
