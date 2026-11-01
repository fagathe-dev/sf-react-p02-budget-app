import React from 'react';
import styled from 'styled-components';

const Nav = styled.nav`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing?.[2] || '8px'};
`;

const OrderedList = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

export interface BreadcrumbContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const BreadcrumbContainer: React.FC<BreadcrumbContainerProps> = ({
  children,
  ...props
}) => (
  <Nav aria-label="Fil d'Ariane" {...props}>
    <OrderedList>{children}</OrderedList>
  </Nav>
);