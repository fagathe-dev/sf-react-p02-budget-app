import { Button } from '@/ui/components/Base/Button';
import { Icon } from '@/ui/components/Base/Icon';
import styled from 'styled-components';
import { Modal } from './Modal';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} 0`};
`;

const MessageText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.body};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <Modal.Header title={title} onClose={onClose} />
      <Modal.Body>
        <MessageContainer>
          <Icon
            name={variant === 'danger' ? 'alert-circle' : 'help-circle'}
            size={40}
            color={variant === 'danger' ? '#ef4444' : '#f59e0b'}
          />
          <MessageText>{message}</MessageText>
        </MessageContainer>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
