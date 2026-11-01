import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface RowProps extends BaseComponentProps {
  gutter?: string;
}

export const Row = styled.div.attrs<RowProps>((props) => ({
  as: props.as || 'div',
}))<RowProps>`
  display: flex;
  flex-wrap: wrap;
  row-gap: ${({ gutter, theme }) => gutter || theme.spacing[2]};
  margin-right: -${({ gutter, theme }) => gutter || theme.spacing[2]};
  margin-left: -${({ gutter, theme }) => gutter || theme.spacing[2]};

  & > * {
    padding-right: ${({ gutter, theme }) => gutter || theme.spacing[2]};
    padding-left: ${({ gutter, theme }) => gutter || theme.spacing[2]};
  }
`;
