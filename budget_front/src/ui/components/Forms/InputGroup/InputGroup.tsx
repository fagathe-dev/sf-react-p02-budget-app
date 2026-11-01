// frontend/src/ui/components/Forms/InputGroup/InputGroup.tsx
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';
import { Input } from '../Input';

export interface InputGroupProps extends BaseComponentProps {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const GroupWrapper = styled.div`
  display: flex;
  align-items: stretch;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.background.surface};
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.borders.focusRing.color};
  }

  & > ${Input} {
    border: none;
    border-radius: 0;
    &:focus {
      box-shadow: none;
    }
  }
`;

export const InputAddon = styled.span<BaseComponentProps>`
  display: inline-flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  white-space: nowrap;
  user-select: none;
`;

export const InputGroup = ({ leftAddon, rightAddon, children, ...rest }: InputGroupProps) => {
  return (
    <GroupWrapper {...rest}>
      {leftAddon && <InputAddon>{leftAddon}</InputAddon>}
      {children}
      {rightAddon && <InputAddon>{rightAddon}</InputAddon>}
    </GroupWrapper>
  );
};
