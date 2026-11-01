import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface LinkProps extends BaseComponentProps {
  href: string;
  target?: '_blank' | '_self';
  rel?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  as?: 'a' | 'button' | 'span' | 'div';
}

const StyledLink = styled.a`
  color: ${({ theme }) => theme.colors.primary.base};
  text-decoration: none;
  cursor: pointer;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  transition: color 0.15s ease;
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
  font-family: inherit;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.hover};
    text-decoration: underline;
  }
`;

export const Link = ({
  as = 'a',
  href,
  onClick,
  children,
  ...rest
}: LinkProps) => {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (as !== 'a' && href && !e.defaultPrevented) {
      window.location.href = href;
    }
  };

  return (
    <StyledLink
      as={as}
      href={as === 'a' ? href : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </StyledLink>
  );
};
