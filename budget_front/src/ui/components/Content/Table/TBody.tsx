import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const Tbody = styled.tbody<BaseComponentProps>`
  & > tr:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  }
`;
