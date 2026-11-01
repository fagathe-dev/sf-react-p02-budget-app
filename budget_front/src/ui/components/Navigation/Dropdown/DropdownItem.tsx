// frontend/src/ui/components/Navigation/Dropdown/DropdownItem.tsx
import { ClickableComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';
import { useGenericDropdown } from './DropdownContext';

export interface DropdownItemProps extends ClickableComponentProps {
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

const StyledItem = styled.button<{ $variant: 'default' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[2.5]}`};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  ${({ $variant, theme }) =>
    $variant === 'danger'
      ? css`
          color: ${theme.colors.danger.base};
          &:hover:not(:disabled) {
            background-color: ${theme.colors.danger.subtle};
            color: ${theme.colors.danger.dark};
          }
        `
      : css`
          color: ${theme.colors.text.body};
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

export const DropdownDivider = styled.li`
  height: 1px;
  margin: ${({ theme }) => `${theme.spacing[1]} 0`};
  background-color: ${({ theme }) => theme.colors.border.default};
`;

export const DropdownItem = ({ icon, variant = 'default', onClick, children, ...rest }: DropdownItemProps) => {
  const { close } = useGenericDropdown();

  return (
    <li role="none">
      <StyledItem
        type="button"
        role="menuitem"
        $variant={variant}
        onClick={(e) => {
          onClick?.(e);
          close();
        }}
        {...rest}
      >
        {icon}
        <span>{children}</span>
      </StyledItem>
    </li>
  );
};
