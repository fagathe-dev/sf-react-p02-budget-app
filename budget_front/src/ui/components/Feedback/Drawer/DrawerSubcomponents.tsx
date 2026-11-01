// frontend/src/ui/components/Feedback/Drawer/DrawerSubcomponents.tsx
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

const HeaderBox = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[3.5]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
`;

export interface DrawerHeaderProps extends BaseComponentProps {
  title?: string;
  onClose?: () => void;
}

export const DrawerHeader = ({ title, onClose, children, ...rest }: DrawerHeaderProps) => (
  <HeaderBox {...rest}>
    {title ? <Title>{title}</Title> : children}
    {onClose && <IconButton name="close" size="sm" variant="ghost" aria-label="Fermer le panneau" onClick={onClose} />}
  </HeaderBox>
);

export const DrawerBody = styled.div<BaseComponentProps>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[4]};
  overflow-y: auto;
  color: ${({ theme }) => theme.colors.text.body};
`;

export const DrawerFooter = styled.footer<BaseComponentProps>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
`;
