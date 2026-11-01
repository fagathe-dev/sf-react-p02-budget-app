import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export type IconSet = 'mdi' | 'bx' | 'bxs' | 'bxl';

export interface IconProps extends BaseComponentProps {
  name: string;
  iconSet?: IconSet;
  size?: number | string;
  color?: string;
  spin?: boolean;
  rotate?: 90 | 180 | 270;
}

const resolveIconClasses = (name: string, iconSet?: IconSet): string => {
  // 1. Détection automatique si le préfixe est déjà dans le nom
  if (name.startsWith('mdi-')) return `mdi ${name}`;
  if (
    name.startsWith('bxs-') ||
    name.startsWith('bxl-') ||
    name.startsWith('bx-')
  ) {
    return `bx ${name}`;
  }

  // 2. Détection via la prop iconSet
  if (iconSet === 'bxs') return `bx bxs-${name}`;
  if (iconSet === 'bxl') return `bx bxl-${name}`;
  if (iconSet === 'bx') return `bx bx-${name}`;
  if (iconSet === 'mdi') return `mdi mdi-${name}`;

  // 3. Fallback par défaut sur MDI (le catalogue le plus complet de ta fonte)
  return `mdi mdi-${name}`;
};

interface StyledIconProps {
  $size?: number | string;
  $color?: string;
  $spin?: boolean;
  $rotate?: number;
}

const StyledIcon = styled.i<StyledIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
  vertical-align: middle;

  font-size: ${({ $size = 20 }) =>
    typeof $size === 'number' ? `${$size}px` : $size};
  color: ${({ $color = 'currentColor' }) => $color};

  ${({ $rotate }) =>
    $rotate &&
    css`
      transform: rotate(${$rotate}deg);
    `}

  ${({ $spin }) =>
    $spin &&
    css`
      animation: ds-icon-spin 2s linear infinite;

      @keyframes ds-icon-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}
`;

export const Icon = ({
  name,
  iconSet,
  size,
  color,
  spin,
  rotate,
  className = '',
  ...rest
}: IconProps) => {
  const iconClasses = resolveIconClasses(name, iconSet);
  const fullClassName = `${iconClasses} ${className}`.trim();

  return (
    <StyledIcon
      className={fullClassName}
      $size={size}
      $color={color}
      $spin={spin}
      $rotate={rotate}
      aria-hidden="true"
      {...rest}
    />
  );
};
