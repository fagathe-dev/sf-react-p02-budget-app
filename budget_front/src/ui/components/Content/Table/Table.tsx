import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement>, BaseComponentProps {
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  dense?: boolean;
}

export const Table = styled.table<TableProps>`
  width: 100%;
  caption-side: bottom;
  border-collapse: collapse;
  vertical-align: middle;
  font-size: ${({ dense, theme }) =>
    dense ? theme.typography.sizes.sm : theme.typography.sizes.base};
  color: ${({ theme }) => theme.colors.text.body};
  background-color: ${({ theme }) => theme.colors.background.surface};

  ${({ bordered, theme }) =>
    bordered &&
    css`
      border: 1px solid ${theme.colors.border.default};
    `}

  ${({ striped, theme }) =>
    striped &&
    css`
      & > tbody > tr:nth-of-type(odd) {
        background-color: ${theme.colors.background.surfaceHover};
      }
    `}

  ${({ hoverable, theme }) =>
    hoverable &&
    css`
      & > tbody > tr:hover {
        background-color: ${theme.colors.background.surfaceActive};
      }
    `}
`;
