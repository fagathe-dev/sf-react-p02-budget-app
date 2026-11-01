import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { DropdownContext, useDropdown } from './NavbarDropdownContext';

// ---------------------------------------------------------------------------
// Styles Styled-Components
// ---------------------------------------------------------------------------

const DropdownContainer = styled.div`
  position: relative;
  display: inline-flex;
`;

const DropdownToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[3]}`};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.text.body};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    color: ${({ theme }) => theme.colors.text.heading};
  }
`;

const MenuWrapper = styled.ul<{ $isOpen: boolean; $align: 'left' | 'right' }>`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing[1.5]});
  ${({ $align }) => ($align === 'right' ? 'right: 0;' : 'left: 0;')};
  z-index: 1000;
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  flex-direction: column;
  min-width: 260px;
  max-width: 340px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing[2]};
  list-style: none;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: none;
  border-radius: 0.45rem;
  box-shadow: ${({ theme }) => theme.shadows.md};
  box-sizing: border-box;
`;

const HeaderLi = styled.li`
  padding: ${({ theme }) => `${theme.spacing[2]}${theme.spacing[3]}`};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ItemLi = styled.li`
  width: 100%;
`;

const ItemBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
  background: transparent;
  border: none;
  border-radius: 0.45rem;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    color: ${({ theme }) => theme.colors.text.heading};
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background-color: ${theme.colors.primary.subtle};
      color: ${theme.colors.primary.base};
    `}
`;

const DividerLi = styled.li`
  margin: ${({ theme }) => `${theme.spacing[1.5]} 0`};
  border: none;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border.default};
`;

// ---------------------------------------------------------------------------
// Composants React
// ---------------------------------------------------------------------------

export const NavbarDropdown: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <DropdownContainer ref={containerRef}>{children}</DropdownContainer>
    </DropdownContext.Provider>
  );
};

export const NavbarDropdownToggle: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => {
  const { isOpen, toggle } = useDropdown();

  return (
    <DropdownToggleBtn
      type="button"
      onClick={toggle}
      aria-haspopup="true"
      aria-expanded={isOpen}
      {...props}
    >
      {children}
    </DropdownToggleBtn>
  );
};

export const NavbarDropdownMenu: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ children, align = 'right' }) => {
  const { isOpen } = useDropdown();

  return (
    <MenuWrapper $isOpen={isOpen} $align={align} role="menu">
      {children}
    </MenuWrapper>
  );
};

// Typage polymorphique générique
export type NavbarDropdownItemProps<E extends React.ElementType = 'button'> = {
  as?: E;
  active?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'active'>;

export const NavbarDropdownItem = <E extends React.ElementType = 'button'>({
  as,
  children,
  onClick,
  active,
  ...props
}: NavbarDropdownItemProps<E>) => {
  const { close } = useDropdown();

  return (
    <ItemLi role="none">
      <ItemBtn
        as={as as any}
        role="menuitem"
        $active={active}
        onClick={(e: React.MouseEvent) => {
          onClick?.(e as any);
          close();
        }}
        {...(props as any)}
      >
        {children}
      </ItemBtn>
    </ItemLi>
  );
};

export const NavbarDropdownHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <HeaderLi role="presentation">{children}</HeaderLi>;

export const NavbarDropdownDivider: React.FC = () => (
  <DividerLi role="separator" />
);
