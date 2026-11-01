import { BaseComponentProps } from '@/ui/types';
import { BreakPointType } from 'core-ts';
import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { SidebarContext, SidebarProvider, useSidebar } from './SidebarContext';

export interface SidebarProps
  extends
    BaseComponentProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'onToggle'> {
  breakpoint?: BreakPointType;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  width?: string;
}

const Backdrop = styled.div<{ $isOpen: boolean; $breakpoint?: string }>`
  display: none;

  ${({ $breakpoint, $isOpen, theme }) =>
    $breakpoint &&
    css`
      @media (max-width: ${theme.breakpoints[
          $breakpoint as keyof typeof theme.breakpoints
        ]}) {
        display: ${$isOpen ? 'block' : 'none'};
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 998;
        backdrop-filter: blur(2px);
        transition: opacity 0.2s ease;
      }
    `}
`;

const StyledSidebar = styled.aside<{
  $isOpen: boolean;
  $width: string;
  $breakpoint?: string;
}>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: ${({ $width }) => $width};
  min-width: ${({ $width }) => $width};
  height: 100vh;
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border.default};
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 0.25s ease-in-out;

  ${({ $breakpoint, $isOpen, theme }) =>
    $breakpoint &&
    css`
      @media (max-width: ${theme.breakpoints[
          $breakpoint as keyof typeof theme.breakpoints
        ]}) {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 999;
        box-shadow: ${theme.shadows.lg};
        transform: ${$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
      }
    `}
`;

const SidebarInternal: React.FC<SidebarProps> = ({
  width = '260px',
  breakpoint: overrideBreakpoint,
  isOpen: _isOpen,
  onToggle: _onToggle,
  children,
  ...props
}) => {
  const { isOpen, close, breakpoint } = useSidebar();
  const activeBreakpoint = overrideBreakpoint ?? breakpoint;

  return (
    <>
      <Backdrop
        $isOpen={isOpen}
        $breakpoint={activeBreakpoint}
        onClick={close}
      />
      <StyledSidebar
        $isOpen={isOpen}
        $width={width}
        $breakpoint={activeBreakpoint}
        {...props}
      >
        {children}
      </StyledSidebar>
    </>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  breakpoint = 'md',
  isOpen,
  onToggle,
  ...props
}) => {
  const existingContext = useContext(SidebarContext);

  if (existingContext) {
    return <SidebarInternal breakpoint={breakpoint} {...props} />;
  }

  return (
    <SidebarProvider
      breakpoint={breakpoint}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <SidebarInternal breakpoint={breakpoint} {...props} />
    </SidebarProvider>
  );
};
