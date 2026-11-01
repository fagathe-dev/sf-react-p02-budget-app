import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const NavbarNav = styled.ul<BaseComponentProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;
