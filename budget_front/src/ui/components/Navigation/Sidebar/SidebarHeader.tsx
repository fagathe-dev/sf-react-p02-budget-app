import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const SidebarHeader = styled.div<BaseComponentProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  box-sizing: border-box;
  gap: ${({ theme }) => theme.spacing[2]};
`;
