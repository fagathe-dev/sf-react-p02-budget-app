import { Icon } from '@/ui/components/Base/Icon';
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

const ItemLi = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1.4;
`;

const interactiveStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.text.muted};
  text-decoration: none;
  font-weight: 500;
  border-radius: 6px;
  padding: 2px 6px;
  margin: -2px -6px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.heading};
    background-color: ${({ theme }) => theme.colors.background.surfaceHover || 'rgba(0, 0, 0, 0.04)'};
  }
`;

const StyledLink = styled(Link)`
  ${interactiveStyles}
`;

const StyledButton = styled.button`
  ${interactiveStyles}
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
`;

const ActiveSpan = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.text.heading};
  font-weight: 600;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export interface BreadcrumbItemProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  icon?: string;
  active?: boolean;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ children, to, onClick, icon, active = false }) => {
  const content = (
    <>
      {icon && <Icon name={icon} size={15} />}
      <span>{children}</span>
    </>
  );

  return (
    <ItemLi>
      {active ? (
        <ActiveSpan aria-current="page">{content}</ActiveSpan>
      ) : to ? (
        <StyledLink to={to}>{content}</StyledLink>
      ) : onClick ? (
        <StyledButton type="button" onClick={onClick}>
          {content}
        </StyledButton>
      ) : (
        <ActiveSpan>{content}</ActiveSpan>
      )}
    </ItemLi>
  );
};
