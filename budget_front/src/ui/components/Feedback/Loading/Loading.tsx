import { BaseComponentProps } from '@/ui/types';
import styled, { keyframes } from 'styled-components';

export type LoadingSize = 'sm' | 'base' | 'lg';

export interface LoadingProps extends BaseComponentProps {
  size?: LoadingSize;
  color?: string;
  label?: string;
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const sizeMap: Record<LoadingSize, number> = {
  sm: 16,
  base: 24,
  lg: 36,
};

const SpinnerSvg = styled.svg<{ $size: number; $color?: string }>`
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  animation: ${spin} 0.8s linear infinite;
  color: ${({ $color, theme }) => $color || theme.colors.primary.base};
`;

export const Loading = ({
  size = 'base',
  color,
  label = 'Chargement en cours…',
  ...rest
}: LoadingProps) => {
  const dimension = sizeMap[size];

  return (
    <SpinnerSvg
      $size={dimension}
      $color={color}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
      {...rest}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </SpinnerSvg>
  );
};
