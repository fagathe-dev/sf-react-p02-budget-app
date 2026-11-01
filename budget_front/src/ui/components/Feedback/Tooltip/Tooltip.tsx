// frontend/src/ui/components/Feedback/Tooltip/Tooltip.tsx
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled, { css } from 'styled-components';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends BaseComponentProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
}

const Bubble = styled.span<{ $placement: TooltipPlacement }>`
  position: absolute;
  z-index: 1200;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.palettes.slate[900]};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;

  ${({ $placement }) => {
    switch ($placement) {
      case 'bottom':
        return css`
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) translateY(-4px);
        `;
      case 'left':
        return css`
          right: calc(100% + 6px);
          top: 50%;
          transform: translateY(-50%) translateX(4px);
        `;
      case 'right':
        return css`
          left: calc(100% + 6px);
          top: 50%;
          transform: translateY(-50%) translateX(-4px);
        `;
      case 'top':
      default:
        return css`
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
        `;
    }
  }}
`;

const Wrapper = styled.span`
  position: relative;
  display: inline-flex;

  &:hover > ${Bubble}, &:focus-within > ${Bubble} {
    opacity: 1;
    transform: ${({ children }) => (children ? 'translateX(-50%) translateY(0)' : 'none')};
  }
`;

export const Tooltip = ({ content, placement = 'top', children, ...rest }: TooltipProps) => {
  return (
    <Wrapper {...rest}>
      {children}
      <Bubble $placement={placement} role="tooltip">
        {content}
      </Bubble>
    </Wrapper>
  );
};
