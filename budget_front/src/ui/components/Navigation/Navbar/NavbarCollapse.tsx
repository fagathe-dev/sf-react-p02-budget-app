import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';
import { useNavbar } from './NavbarContext';

const CollapseWrapper = styled.div<{ $isOpen: boolean; $breakpoint?: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;

  ${({ $breakpoint, $isOpen, theme }) =>
    $breakpoint &&
    css`
      @media (max-width: ${theme.breakpoints[
          $breakpoint as keyof typeof theme.breakpoints
        ]}) {
        display: ${$isOpen ? 'flex' : 'none'};
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        margin-top: ${theme.spacing[2]};
        padding-top: ${theme.spacing[2]};
        border-top: 1px solid ${theme.colors.border.default};
        gap: ${theme.spacing[2]};
      }
    `}
`;

export const NavbarCollapse: React.FC<
  BaseComponentProps & React.HTMLAttributes<HTMLDivElement>
> = ({ children, ...props }) => {
  const { isOpen, breakpoint } = useNavbar();

  return (
    <CollapseWrapper $isOpen={isOpen} $breakpoint={breakpoint} {...props}>
      {children}
    </CollapseWrapper>
  );
};
