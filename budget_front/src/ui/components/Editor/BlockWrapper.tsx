// frontend/src/ui/components/Editor/BlockWrapper.tsx
import { Badge } from '@/ui/components/Base/Badge';
import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import React from 'react';
import styled from 'styled-components';

export interface BlockWrapperProps extends BaseComponentProps {
  blockType: string;
  position: number;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onOpenSettings?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const Shell = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.base};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[1.5]}${theme.spacing[3]}`};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const DragHandle = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const BlockWrapper = ({
  blockType,
  position,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  onOpenSettings,
  dragHandleProps,
  children,
  ...rest
}: BlockWrapperProps) => {
  return (
    <Shell {...rest}>
      <Toolbar>
        <LeftGroup>
          <DragHandle title="Glisser pour déplacer" {...dragHandleProps}>
            <Icon name="drag-vertical" size={18} />
          </DragHandle>
          <Badge variant="neutral">#{position}</Badge>
          <Badge variant="primary" pill>
            {blockType.toUpperCase()}
          </Badge>
        </LeftGroup>

        <RightActions>
          {onMoveUp && (
            <IconButton name="arrow-up" size="sm" aria-label="Monter le bloc" disabled={isFirst} onClick={onMoveUp} />
          )}
          {onMoveDown && (
            <IconButton
              name="arrow-down"
              size="sm"
              aria-label="Descendre le bloc"
              disabled={isLast}
              onClick={onMoveDown}
            />
          )}
          {onOpenSettings && (
            <IconButton name="cog-outline" size="sm" aria-label="Paramètres du bloc" onClick={onOpenSettings} />
          )}
          {onDelete && (
            <IconButton
              name="trash-can-outline"
              size="sm"
              variant="danger"
              aria-label="Supprimer le bloc"
              onClick={onDelete}
            />
          )}
        </RightActions>
      </Toolbar>
      <Body>{children}</Body>
    </Shell>
  );
};
