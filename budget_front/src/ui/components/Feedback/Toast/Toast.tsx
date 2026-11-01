// frontend/src/ui/components/Feedback/Toast/Toast.tsx
import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import styled, { css, keyframes } from 'styled-components';
import { ToastVariant } from './useToast';

export interface ToastProps extends BaseComponentProps {
  variant?: ToastVariant;
  title?: string;
  onClose?: () => void;
}

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
`;

const toastIcons: Record<ToastVariant, string> = {
  info: 'information',
  success: 'check-circle',
  warning: 'alert',
  danger: 'alert-circle',
};

const ToastWrapper = styled.div<{ $variant: ToastVariant }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 300px;
  max-width: 420px;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border-radius: ${({ theme }) => theme.radii.base};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  animation: ${slideIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;

  ${({$variant, theme }) => {
    const role = theme.colors[$variant];
    return css`
      border-left: 4px solid ${role.base};
      & > i {
        color: ${role.base};
      }
    `;
  }}
`;

const Content = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text.body};
`;

const ToastTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text.heading};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[0.5]};
`;

export const Toast = ({
  variant = 'info',
  title,
  onClose,
  children,
  ...rest
}: ToastProps) => {
  return (
    <ToastWrapper $variant={variant} role="status" {...rest}>
      <Icon name={toastIcons[variant]} size={20} />
      <Content>
        {title && <ToastTitle>{title}</ToastTitle>}
        <div>{children}</div>
      </Content>
      {onClose && (
        <IconButton
          name="close"
          size="sm"
          variant="ghost"
          aria-label="Fermer la notification"
          onClick={onClose}
        />
      )}
    </ToastWrapper>
  );
};