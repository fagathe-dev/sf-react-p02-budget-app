// frontend/src/ui/components/Embed/Carousel/CarouselSlide.tsx
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface CarouselSlideProps extends BaseComponentProps {
  currentIndex: number;
}

const Track = styled.div<{ $currentIndex: number }>`
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  transform: translateX(-${({ $currentIndex }) => $currentIndex * 100}%);
`;

export const CarouselSlide = ({ currentIndex, children, ...rest }: CarouselSlideProps) => {
  return (
    <Track $currentIndex={currentIndex} {...rest}>
      {children}
    </Track>
  );
};
