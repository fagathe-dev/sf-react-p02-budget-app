import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface ProgressProps extends BaseComponentProps {
  value: number; // 0 à 100
  height?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

const Track = styled.div<{ $height: string }>`
  width: 100%;
  height: ${({ $height }) => $height};
  background-color: ${({ theme }) => theme.colors.background.surfaceActive};
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
`;

const Bar = styled.div<{ $value: number; $variant: string }>`
  height: 100%;
  width: ${({ $value }) => `${Math.min(Math.max($value, 0), 100)}%`};
  background-color: ${({ $variant, theme }) => {
    const colorOption = theme.colors[$variant as keyof typeof theme.colors];
    if (
      colorOption &&
      typeof colorOption === 'object' &&
      'base' in colorOption
    ) {
      return (colorOption as { base: string }).base;
    }
    return theme.colors.primary.base;
  }};
  border-radius: inherit;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const Progress = ({
  value,
  height = '6px',
  variant = 'primary',
  ...rest
}: ProgressProps) => {
  return (
    <Track
      $height={height}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <Bar $value={value} $variant={variant} />
    </Track>
  );
};
