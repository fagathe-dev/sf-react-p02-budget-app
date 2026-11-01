// frontend/src/ui/components/Embed/Carousel/Carousel.tsx
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import { Children, useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { CarouselIndicator } from './CarouselIndicator';
import { CarouselItem } from './CarouselItem';
import { CarouselSlide } from './CarouselSlide';

export interface CarouselProps extends BaseComponentProps {
  aspectRatio?: string;
  showIndicators?: boolean;
  showArrows?: boolean;
  defaultIndex?: number;
  autoplay?: boolean;
  slideInterval?: number;
}

const Viewport = styled.div<{ $aspectRatio?: string }>`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base};
  background-color: ${({ theme }) => theme.colors.background.surfaceActive};

  ${({ $aspectRatio }) =>
    $aspectRatio &&
    css`
      aspect-ratio: ${$aspectRatio};
    `}
`;

const NavButton = styled(IconButton)<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $direction }) => ($direction === 'left' ? 'left: 12px;' : 'right: 12px;')}
  z-index: 2;
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  opacity: 0.85;

  &:hover:not(:disabled) {
    opacity: 1;
  }
`;

const BaseCarousel = ({
  aspectRatio = '16/9',
  showIndicators = true,
  showArrows = true,
  defaultIndex = 0,
  autoplay = false,
  slideInterval = 4000,
  children,
  ...rest
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const [isPaused, setIsPaused] = useState(false);

  const items = Children.toArray(children);
  const total = items.length;

  const prev = useCallback(() => {
    setCurrentIndex((c) => (c > 0 ? c - 1 : total - 1));
  }, [total]);

  const next = useCallback(() => {
    setCurrentIndex((c) => (c < total - 1 ? c + 1 : 0));
  }, [total]);

  useEffect(() => {
    if (!autoplay || isPaused || total <= 1 || slideInterval <= 0) return;

    const timer = setInterval(next, slideInterval);
    return () => clearInterval(timer);
  }, [autoplay, isPaused, total, slideInterval, next]);

  if (total === 0) return null;

  return (
    <Viewport
      $aspectRatio={aspectRatio}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...rest}
    >
      <CarouselSlide currentIndex={currentIndex}>{items}</CarouselSlide>

      {showArrows && total > 1 && (
        <>
          <NavButton
            $direction="left"
            name="chevron-left"
            size="sm"
            round
            aria-label="Diapositive précédente"
            onClick={prev}
          />
          <NavButton
            $direction="right"
            name="chevron-right"
            size="sm"
            round
            aria-label="Diapositive suivante"
            onClick={next}
          />
        </>
      )}

      {showIndicators && <CarouselIndicator total={total} currentIndex={currentIndex} onSelect={setCurrentIndex} />}
    </Viewport>
  );
};

export const Carousel = Object.assign(BaseCarousel, {
  Item: CarouselItem,
  Slide: CarouselSlide,
  Indicator: CarouselIndicator,
});
