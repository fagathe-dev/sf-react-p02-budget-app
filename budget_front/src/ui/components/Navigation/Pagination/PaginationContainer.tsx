// frontend/src/ui/components/Navigation/Pagination/PaginationContainer.tsx
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface PaginationContainerProps
  extends React.HTMLAttributes<HTMLElement>,
    BaseComponentProps {}

const Nav = styled.nav`
  display: flex;
  justify-content: center;
`;

const List = styled.ul`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const PaginationContainer: React.FC<PaginationContainerProps> = ({
  children,
  'aria-label': ariaLabel = 'Navigation pagination',
  ...rest
}) => {
  return (
    <Nav aria-label={ariaLabel} {...rest}>
      <List>{children}</List>
    </Nav>
  );
};