import { Icon } from '@/ui/components/Base/Icon';
import { ClickableComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';
import { useNavbar } from './NavbarContext';

const ToggleButton = styled.button<{ $breakpoint?: string }>`
  display: none;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[2]};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.text.body};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    color: ${({ theme }) => theme.colors.text.heading};
  }

  ${({ $breakpoint, theme }) =>
    $breakpoint &&
    css`
      @media (max-width: ${theme.breakpoints[
          $breakpoint as keyof typeof theme.breakpoints
        ]}) {
        display: inline-flex;
      }
    `}
`;

export const NavbarToggle: React.FC<ClickableComponentProps> = ({
  children,
  ...props
}) => {
  const { isOpen, toggle, breakpoint } = useNavbar();

  return (
    <ToggleButton
      type="button"
      $breakpoint={breakpoint}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label="Basculer la navigation"
      {...props}
    >
      {children ?? <Icon name={isOpen ? 'close' : 'menu'} size={20} />}
    </ToggleButton>
  );
};
