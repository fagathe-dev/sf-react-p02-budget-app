// frontend/src/ui/components/Forms/FileDropzone/FileDropzone.tsx
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import React, { useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { HelperText } from '../HelperText';
import { Label } from '../Label';

export interface FileDropzoneProps extends BaseComponentProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
  error?: string;
  hint?: string;
  onFilesSelected: (files: File[]) => void;
}

const DropArea = styled.div<{
  $isDragging: boolean;
  $hasError: boolean;
  $disabled?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[6]};
  border: 2px dashed
    ${({ $isDragging, $hasError, theme }) => {
      if ($hasError) return theme.colors.danger.base;
      if ($isDragging) return theme.colors.primary.base;
      return theme.colors.border.default;
    }};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ $isDragging, theme }) =>
    $isDragging
      ? theme.colors.primary.subtle
      : theme.colors.background.surface};
  text-align: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.15s ease;

  ${({ $disabled, theme }) =>
    !$disabled &&
    css`
      &:hover {
        border-color: ${theme.colors.primary.base};
        background-color: ${theme.colors.background.surfaceHover};
      }
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.6;
    `}
`;

const HiddenInput = styled.input`
  display: none;
`;

const MainText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.heading};
`;

const SubText = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const FileDropzone = ({
  label,
  accept = 'image/*,video/*',
  multiple = false,
  maxSizeMb = 10,
  disabled = false,
  error,
  hint,
  onFilesSelected,
  ...rest
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    setLocalError(null);

    const validFiles: File[] = [];
    const maxBytes = maxSizeMb * 1024 * 1024;

    Array.from(fileList).forEach((file) => {
      if (file.size > maxBytes) {
        setLocalError(
          `Le fichier "${file.name}" dépasse la limite de ${maxSizeMb} Mo.`
        );
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const displayedError = error || localError;

  return (
    <div {...rest}>
      {label && <Label>{label}</Label>}
      <DropArea
        $isDragging={isDragging}
        $hasError={Boolean(displayedError)}$disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <HiddenInput
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Icon name="cloud-upload-outline" size={32} />
        <MainText>
          Glissez-déposez vos fichiers ici ou cliquez pour parcourir
        </MainText>
        <SubText>Taille maximale : {maxSizeMb} Mo</SubText>
      </DropArea>
      {displayedError && (
        <HelperText state="invalid">{displayedError}</HelperText>
      )}
      {!displayedError && hint && <HelperText>{hint}</HelperText>}
    </div>
  );
};