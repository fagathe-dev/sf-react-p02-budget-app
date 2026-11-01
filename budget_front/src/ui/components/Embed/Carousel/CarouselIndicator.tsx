// frontend/src/ui/components/Embed/Carousel/CarouselIndicator.tsx
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface CarouselIndicatorProps extends BaseComponentProps {
  total: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

const IndicatorsContainer = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: ${({ theme }) => theme.spacing[1.5]};
  z-index: 2;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $active, theme }) => ($active ? theme.colors.primary.base : theme.colors.white)};
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const CarouselIndicator = ({ total, currentIndex, onSelect, ...rest }: CarouselIndicatorProps) => {
  if (total <= 1) return null;

  return (
    <IndicatorsContainer role="tablist" {...rest}>
      {Array.from({ length: total }).map((_, idx) => (
        <Dot
          key={idx}
          type="button"
          role="tab"
          aria-selected={currentIndex === idx}
          aria-label={`Aller à la diapositive ${idx + 1}`}
          $active={currentIndex === idx}
          onClick={() => onSelect(idx)}
        />
      ))}
    </IndicatorsContainer>
  );
};
