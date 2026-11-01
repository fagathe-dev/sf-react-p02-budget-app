import { Button } from '@/ui/components/Base/Button';
import { Video } from '@/ui/components/Embed/Video';
import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { FileDropzone } from '@/ui/components/Forms/FileDropzone';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';

export interface VideoBlockData {
  url: string;
  caption?: string;
  aspectRatio?: string;
}

export interface VideoBlockProps extends BaseComponentProps {
  data: VideoBlockData;
  onChange: (updated: VideoBlockData) => void;
}

export const VideoBlock = ({ data, onChange, ...rest }: VideoBlockProps) => {
  const handleUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    onChange({ ...data, url: URL.createObjectURL(file) });
  };

  if (!data.url) {
    return (
      <div {...rest}>
        <FileDropzone
          accept="video/mp4,video/webm"
          label="Téléverser un fichier vidéo"
          maxSizeMb={50}
          onFilesSelected={handleUpload}
        />
        <TextField
          label="Ou URL de la vidéo"
          placeholder="https://domaine.com/video.mp4"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </div>
    );
  }

  return (
    <Flex direction="column" gap="1rem" {...rest}>
      <Video src={data.url} aspectRatio={data.aspectRatio || '16/9'} radius="base" controls />

      <TextField
        label="Légende de la vidéo"
        placeholder="Courte description…"
        value={data.caption || ''}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
      />

      <Flex justify="space-between" align="center">
        <ChoiceField
          label="Ratio vidéo"
          value={data.aspectRatio || '16/9'}
          onChange={(e) => onChange({ ...data, aspectRatio: e.target.value })}
        >
          <option value="16/9">16:9 (Paysage classique)</option>
          <option value="9/16">9:16 (Format vertical / mobile)</option>
          <option value="4/3">4:3</option>
        </ChoiceField>

        <Button variant="ghost" size="sm" onClick={() => onChange({ ...data, url: '' })}>
          Changer de vidéo
        </Button>
      </Flex>
    </Flex>
  );
};
