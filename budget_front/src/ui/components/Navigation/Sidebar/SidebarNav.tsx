import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const SidebarNav = styled.nav<BaseComponentProps>`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[2]}`};
  gap: ${({ theme }) => theme.spacing[1]};
  overflow-y: auto;
  box-sizing: border-box;

  /* Scrollbar discrète */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radii.base};
  }
`;