import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

const HeaderWrapper = styled.header`
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

export interface ModalHeaderProps extends BaseComponentProps {
  title?: string;
  onClose?: () => void;
}

export const ModalHeader = ({
  title,
  onClose,
  children,
  ...rest
}: ModalHeaderProps) => {
  return (
    <HeaderWrapper {...rest}>
      {title ? <Title>{title}</Title> : children}
      {onClose && (
        <IconButton
          name="close"
          size="sm"
          variant="ghost"
          aria-label="Fermer la boîte de dialogue"
          onClick={onClose}
        />
      )}
    </HeaderWrapper>
  );
};
