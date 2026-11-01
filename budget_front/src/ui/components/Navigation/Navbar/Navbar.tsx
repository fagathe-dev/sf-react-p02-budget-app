import { BaseComponentProps } from '@/ui/types';
import { BreakPointType } from 'core-ts'; // Ou le chemin relatif vers ton fichier breakpoints.d.ts
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { NavbarContext } from './NavbarContext';

export interface NavbarProps
  extends
    BaseComponentProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'onToggle'> {
  sticky?: boolean;
  breakpoint?: BreakPointType;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

const StyledNav = styled.nav<{ $sticky?: boolean }>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 56px;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  box-sizing: border-box;

  ${({ $sticky }) =>
    $sticky &&
    css`
      position: sticky;
      top: 0;
      z-index: 100;
    `}
`;

export const Navbar: React.FC<NavbarProps> = ({
  sticky,
  breakpoint,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  ...props
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalIsOpen(next);
    onToggle?.(next);
  };

  const close = () => {
    if (!isControlled) setInternalIsOpen(false);
    onToggle?.(false);
  };

  return (
    <NavbarContext.Provider value={{ isOpen, toggle, close, breakpoint }}>
      <StyledNav $sticky={sticky} {...props}>
        {children}
      </StyledNav>
    </NavbarContext.Provider>
  );
};
