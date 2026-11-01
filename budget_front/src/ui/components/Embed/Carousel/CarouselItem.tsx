// frontend/src/ui/components/Embed/Carousel/CarouselItem.tsx
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface CarouselItemProps extends BaseComponentProps {}

export const CarouselItem = styled.div<CarouselItemProps>`
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;
