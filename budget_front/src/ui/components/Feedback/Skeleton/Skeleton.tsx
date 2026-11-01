import { BaseComponentProps } from '@/ui/types';
import styled, { keyframes } from 'styled-components';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends BaseComponentProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const shimmer = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
`;

export const Skeleton = styled.div<SkeletonProps>`
  background-color: ${({ theme }) => theme.colors.background.surfaceActive};
  animation: ${shimmer} 1.6s ease-in-out infinite;

  width: ${({ width }) =>
    width ? (typeof width === 'number' ? `${width}px` : width) : '100%'};
  height: ${({ height, variant }) => {
    if (height) return typeof height === 'number' ? `${height}px` : height;
    if (variant === 'text') return '1rem';
    return '100%';
  }};

  border-radius: ${({ variant = 'text', theme }) => {
    if (variant === 'circular') return theme.radii.full;
    if (variant === 'text') return theme.radii.sm;
    return theme.radii.base;
  }};
`;
