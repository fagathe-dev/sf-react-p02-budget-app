import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export interface DividerProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical';
  margin?: string;
}

export const Divider = styled.hr<DividerProps>`
  border: none;
  background-color: ${({ theme }) => theme.colors.border.default};
  margin: 0;
  flex-shrink: 0;

  ${({ orientation = 'horizontal', margin, theme }) =>
    orientation === 'horizontal'
      ? css`
          width: 100%;
          height: 1px;
          margin: ${margin || `${theme.spacing[2]} 0`};
        `
      : css`
          width: 1px;
          height: 100%;
          min-height: 1rem;
          margin: ${margin || `0 ${theme.spacing[2]}`};
        `}
`;
