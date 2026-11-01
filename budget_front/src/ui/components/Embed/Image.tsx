import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type ImageRadius = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | 'pill' | 'full';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement>, BaseComponentProps {
  fluid?: boolean;
  fit?: ObjectFit;
  aspectRatio?: string;
  radius?: ImageRadius;
  thumbnail?: boolean;
}

export const Image = styled.img.attrs<ImageProps>((props) => ({
  loading: props.loading || 'lazy',
}))<ImageProps>`
  display: block;
  max-width: ${({ fluid = true }) => (fluid ? '100%' : 'none')};
  height: ${({ fluid = true, height }) => (fluid && !height ? 'auto' : undefined)};

  ${({ fit }) =>
    fit &&
    css`
      object-fit: ${fit};
    `}

  ${({ aspectRatio }) =>
    aspectRatio &&
    css`
      aspect-ratio: ${aspectRatio};
    `}

  ${({ radius, theme }) =>
    radius &&
    css`
      border-radius: ${theme.radii[radius]};
    `}

  ${({ thumbnail, theme }) =>
    thumbnail &&
    css`
      padding: ${theme.spacing[1]};
      background-color: ${theme.colors.background.surface};
      border: 1px solid ${theme.colors.border.default};
      border-radius: ${theme.radii.base};
      box-shadow: ${theme.shadows.sm};
    `}
`;
