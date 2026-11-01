import styled from 'styled-components';
import { BaseComponentProps } from '@/ui/types';

export const Tfoot = styled.tfoot<BaseComponentProps>`
  border-top: 2px solid ${({ theme }) => theme.colors.border.default};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;