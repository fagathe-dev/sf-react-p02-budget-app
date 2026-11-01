import React from 'react';
import styled, { css } from 'styled-components';
import { useSidebar } from './SidebarContext';

const StyledLink = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.base};
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
  transition: all 0.15s ease;

  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary.base : theme.colors.text.body};

  ${({ $active, theme }) =>
    $active
      ? css`
          background-color: ${theme.colors.primary.subtle};
          font-weight: ${theme.typography.weights.semibold};
        `
      : css`
          &:hover:not(:disabled) {
            background-color: ${theme.colors.background.surfaceHover};
            color: ${theme.colors.text.heading};
          }
        `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContentSlot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const BadgeSlot = styled.span`
  display: inline-flex;
  align-items: center;
`;

export type SidebarLinkProps<E extends React.ElementType = 'button'> = {
  as?: E;
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'active'>;

export const SidebarLink = <E extends React.ElementType = 'button'>({
  as,
  active,
  icon,
  badge,
  children,
  onClick,
  ...props
}: SidebarLinkProps<E>) => {
  const { close, breakpoint } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e as any);
    // Ferme automatiquement la sidebar sur mobile au clic
    if (breakpoint) close();
  };

  return (
    <StyledLink
      as={as as any}
      $active={active}
      onClick={handleClick}
      {...(props as any)}
    >
      <ContentSlot>
        {icon}
        {children}
      </ContentSlot>
      {badge && <BadgeSlot>{badge}</BadgeSlot>}
    </StyledLink>
  );
};