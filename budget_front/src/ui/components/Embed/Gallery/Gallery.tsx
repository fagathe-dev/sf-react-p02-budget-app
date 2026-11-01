// frontend/src/ui/components/Embed/Gallery/Gallery.tsx
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { GalleryItem } from './GalleryItem';

export interface GalleryProps extends BaseComponentProps {
  columns?: number;
  minColumnWidth?: string;
  gap?: string;
  rule?: string;
}

const StyledGallery = styled.div.attrs<GalleryProps>((props) => ({
  as: props.as || 'div',
}))<GalleryProps>`
  width: 100%;
  columns: ${({ columns = 3, minColumnWidth = '260px' }) => `${columns}${minColumnWidth}`};
  column-gap: ${({ gap, theme }) => gap || theme.spacing[4]};
  ${({ rule }) => rule && `column-rule: ${rule};`}

  & > * {
    break-inside: avoid;
    margin-bottom: ${({ gap, theme }) => gap || theme.spacing[4]};
  }
`;

export const Gallery = Object.assign(StyledGallery, {
  Item: GalleryItem,
});
