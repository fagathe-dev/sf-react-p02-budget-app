// frontend/src/ui/components/Editor/Blocks/CarouselBlock.tsx
import { IconButton } from '@/ui/components/Base/IconButton';
import { Carousel } from '@/ui/components/Embed/Carousel';
import { Image } from '@/ui/components/Embed/Image';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { ToggleField } from '@/ui/components/Forms/Fields/ToggleField';
import { FileDropzone } from '@/ui/components/Forms/FileDropzone';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export interface CarouselSlideItem {
  id: string;
  url: string;
  caption?: string;
}

export interface CarouselBlockData {
  slides: CarouselSlideItem[];
  aspectRatio?: string;
  autoplay?: boolean;
  slideInterval?: number;
}

export interface CarouselBlockProps extends BaseComponentProps {
  data: CarouselBlockData;
  onChange: (updated: CarouselBlockData) => void;
}

const SlideRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-radius: ${({ theme }) => theme.radii.base};
`;

export const CarouselBlock = ({ data, onChange, ...rest }: CarouselBlockProps) => {
  const slides = data.slides || [];
  const autoplay = data.autoplay ?? false;
  const slideInterval = data.slideInterval ?? 4000;

  const handleAddFiles = (files: File[]) => {
    const newItems: CarouselSlideItem[] = files.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(f),
      caption: '',
    }));
    onChange({ ...data, slides: [...slides, ...newItems] });
  };

  const removeSlide = (id: string) => {
    onChange({ ...data, slides: slides.filter((s) => s.id !== id) });
  };

  const updateSlideCaption = (id: string, caption: string) => {
    onChange({
      ...data,
      slides: slides.map((s) => (s.id === id ? { ...s, caption } : s)),
    });
  };

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      {slides.length > 0 && (
        <Carousel aspectRatio={data.aspectRatio || '16/9'} autoplay={autoplay} slideInterval={slideInterval}>
          {slides.map((slide) => (
            <Carousel.Item key={slide.id}>
              <Image src={slide.url} alt={slide.caption || ''} fit="cover" style={{ width: '100%', height: '100%' }} />
            </Carousel.Item>
          ))}
        </Carousel>
      )}

      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <ToggleField
          label="Défilement automatique (Autoplay)"
          checked={autoplay}
          onChange={(e) => onChange({ ...data, autoplay: e.target.checked })}
        />

        {autoplay && (
          <TextField
            type="number"
            label="Intervalle (ms)"
            value={slideInterval}
            onChange={(e) =>
              onChange({
                ...data,
                slideInterval: Number(e.target.value) || 4000,
              })
            }
          />
        )}
      </Flex>

      <FileDropzone
        multiple
        accept="image/*"
        label="Ajouter des diapositives au carrousel"
        onFilesSelected={handleAddFiles}
      />

      {slides.length > 0 && (
        <Flex direction="column" gap="0.5rem">
          {slides.map((s, idx) => (
            <SlideRow key={s.id}>
              <Image src={s.url} width={48} height={36} fit="cover" radius="sm" />
              <TextField
                placeholder={`Légende diapositive #${idx + 1}`}
                value={s.caption || ''}
                onChange={(e) => updateSlideCaption(s.id, e.target.value)}
              />
              <IconButton
                name="trash-can-outline"
                size="sm"
                variant="danger"
                aria-label="Supprimer la diapositive"
                onClick={() => removeSlide(s.id)}
              />
            </SlideRow>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
