import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const SidebarFooter = styled.div<BaseComponentProps>`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-sizing: border-box;
  gap: ${({ theme }) => theme.spacing[2]};
`;