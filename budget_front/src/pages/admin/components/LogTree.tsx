import { LogNode } from '@/types/log.types';
import { Icon } from '@/ui/components/Base/Icon';
import { useState } from 'react';
import styled, { css } from 'styled-components';

const TreeList = styled.ul<{ $depth: number }>`
  list-style: none;
  margin: 0;
  padding: 0;
  padding-left: ${({ $depth, theme }) => ($depth > 0 ? theme.spacing[4] : 0)};
`;

const NodeButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[1.5]} ${theme.spacing[2]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
  text-align: left;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  overflow-wrap: anywhere;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.primary.dark};
      background-color: ${theme.colors.primary.subtle};
      font-weight: ${theme.typography.weights.semibold};

      &:hover {
        background-color: ${theme.colors.primary.subtle};
      }
    `}
`;

interface LogTreeProps {
  nodes: LogNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}

const FolderNode = ({
  node,
  selectedPath,
  onSelect,
  depth,
}: Omit<LogTreeProps, 'nodes'> & { node: Extract<LogNode, { type: 'folder' }> }) => {
  // Ouvert par défaut s'il contient le fichier sélectionné
  const [isOpen, setIsOpen] = useState(() => selectedPath?.startsWith(`${node.path}.`) ?? false);

  return (
    <li>
      <NodeButton type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} />
        <Icon name={isOpen ? 'folder-open-outline' : 'folder-outline'} size={16} />
        {node.name}
      </NodeButton>
      {isOpen && (
        <LogTree nodes={node.children} selectedPath={selectedPath} onSelect={onSelect} depth={(depth ?? 0) + 1} />
      )}
    </li>
  );
};

export const LogTree = ({ nodes, selectedPath, onSelect, depth = 0 }: LogTreeProps) => (
  <TreeList $depth={depth}>
    {nodes.map((node) =>
      node.type === 'folder' ? (
        <FolderNode key={node.path} node={node} selectedPath={selectedPath} onSelect={onSelect} depth={depth} />
      ) : (
        <li key={node.path}>
          <NodeButton
            type="button"
            $active={node.path === selectedPath}
            aria-current={node.path === selectedPath ? 'true' : undefined}
            onClick={() => onSelect(node.path)}
          >
            <Icon name="file-document-outline" size={16} />
            {node.name}
          </NodeButton>
        </li>
      )
    )}
  </TreeList>
);
