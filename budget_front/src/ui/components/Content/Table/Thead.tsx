import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const Thead = styled.thead<BaseComponentProps>`
  border-bottom: 2px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
`;
