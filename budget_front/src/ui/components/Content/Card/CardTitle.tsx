import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const CardTitle = styled.h3<BaseComponentProps>`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;
