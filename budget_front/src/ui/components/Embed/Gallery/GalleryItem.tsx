// frontend/src/ui/components/Embed/Gallery/GalleryItem.tsx
import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export type GalleryItemRadius = 'none' | 'sm' | 'base' | 'lg' | 'xl';

export interface GalleryItemProps extends BaseComponentProps {
  radius?: GalleryItemRadius;
  hoverZoom?: boolean;
}

export const GalleryItem = styled.div<GalleryItemProps>`
  break-inside: avoid;
  page-break-inside: avoid;
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: ${({ radius = 'base', theme }) => theme.radii[radius]};

  ${({ hoverZoom }) =>
    hoverZoom &&
    css`
      & img,
      & video {
        transition: transform 0.3s ease;
      }

      &:hover img,
      &:hover video {
        transform: scale(1.03);
      }
    `}
`;
