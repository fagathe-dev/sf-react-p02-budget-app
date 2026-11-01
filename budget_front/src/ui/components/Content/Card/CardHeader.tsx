import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const CardHeader = styled.header<BaseComponentProps>`
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
