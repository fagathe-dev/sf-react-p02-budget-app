import { Button } from '@/ui/components/Base/Button';
import { Figure } from '@/ui/components/Embed/Figure';
import { Image } from '@/ui/components/Embed/Image';
import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { FileDropzone } from '@/ui/components/Forms/FileDropzone';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';

export interface ImageBlockData {
  url: string;
  alt?: string;
  caption?: string;
  aspectRatio?: string;
}

export interface ImageBlockProps extends BaseComponentProps {
  data: ImageBlockData;
  onChange: (updated: ImageBlockData) => void;
}

export const ImageBlock = ({ data, onChange, ...rest }: ImageBlockProps) => {
  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const fakeUrl = URL.createObjectURL(file);
    onChange({ ...data, url: fakeUrl });
  };

  if (!data.url) {
    return (
      <div {...rest}>
        <FileDropzone accept="image/*" label="Sélectionner une image" onFilesSelected={handleFileUpload} />
        <TextField
          label="Ou renseigner l'URL directe"
          placeholder="https://..."
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </div>
    );
  }

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      <Figure caption={data.caption} captionAlign="center">
        <Image src={data.url} alt={data.alt || ''} aspectRatio={data.aspectRatio || '16/9'} fit="cover" radius="base" />
      </Figure>

      <Flex gap="1rem" wrap="wrap">
        <TextField
          label="Légende"
          placeholder="Texte affiché sous l'image…"
          value={data.caption || ''}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
        <TextField
          label="Texte alternatif (Alt)"
          placeholder="Description pour l'accessibilité…"
          value={data.alt || ''}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
      </Flex>

      <Flex justify="space-between" align="center">
        <ChoiceField
          label="Format d'affichage"
          value={data.aspectRatio || '16/9'}
          onChange={(e) => onChange({ ...data, aspectRatio: e.target.value })}
        >
          <option value="16/9">16:9 (Standard)</option>
          <option value="4/3">4:3</option>
          <option value="1/1">1:1 (Carré)</option>
          <option value="21/9">21:9 (Bannière)</option>
        </ChoiceField>

        <Button variant="ghost" size="sm" onClick={() => onChange({ ...data, url: '' })}>
          Remplacer l'image
        </Button>
      </Flex>
    </Flex>
  );
};
