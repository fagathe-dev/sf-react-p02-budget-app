// frontend/src/ui/components/Editor/BlockPicker.tsx
import { Button } from '@/ui/components/Base/Button';
import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import { useState } from 'react';
import styled from 'styled-components';

export interface BlockTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description?: string;
}

export const DEFAULT_CMS_BLOCKS: BlockTypeDefinition[] = [
  { type: 'text', label: 'Texte riche', icon: 'format-pilcrow' },
  { type: 'image', label: 'Image', icon: 'image-outline' },
  { type: 'code', label: 'Code', icon: 'code-tags' },
  { type: 'quote', label: 'Citation', icon: 'format-quote-close' },
  { type: 'video', label: 'Vidéo', icon: 'video-outline' },
  { type: 'table', label: 'Tableau', icon: 'table' },
  { type: 'faq', label: 'FAQ / Accordéon', icon: 'help-circle-outline' },
  { type: 'cta', label: 'Appel à l’action', icon: 'bullhorn-outline' },
  { type: 'carousel', label: 'Carrousel', icon: 'view-carousel-outline' },
];

export interface BlockPickerProps extends BaseComponentProps {
  onSelectBlock: (type: string) => void;
  availableBlocks?: BlockTypeDefinition[];
}

const PickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: ${({ theme }) => `${theme.spacing[3]} 0`};
`;

const GridMenu = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.base};
`;

const BlockOptionBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.text.body};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.base};
    background-color: ${({ theme }) => theme.colors.primary.subtle};
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

export const BlockPicker = ({ onSelectBlock, availableBlocks = DEFAULT_CMS_BLOCKS, ...rest }: BlockPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PickerContainer {...rest}>
      <Button variant={isOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        <Icon name={isOpen ? 'close' : 'plus'} size={16} />
        {isOpen ? 'Fermer' : 'Ajouter un bloc de contenu'}
      </Button>

      {isOpen && (
        <GridMenu>
          {availableBlocks.map((b) => (
            <BlockOptionBtn
              key={b.type}
              type="button"
              onClick={() => {
                onSelectBlock(b.type);
                setIsOpen(false);
              }}
            >
              <Icon name={b.icon} size={22} />
              <span>{b.label}</span>
            </BlockOptionBtn>
          ))}
        </GridMenu>
      )}
    </PickerContainer>
  );
};
