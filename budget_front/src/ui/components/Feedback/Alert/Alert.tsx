import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export type AlertVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface AlertProps extends BaseComponentProps {
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  showIcon?: boolean;
}

const variantIcons: Record<AlertVariant, string> = {
  primary: 'information',
  success: 'check-circle',
  warning: 'alert',
  danger: 'alert-circle',
  info: 'information',
};

const AlertContainer = styled.div<{ $variant: AlertVariant }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.base};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};

  ${({ $variant, theme }) => {
    const role = theme.colors[$variant];
    return css`
      background-color: ${role.subtle};
      border: 1px solid ${role.dark}30;
      color: ${role.emphasis};

      & > i {
        color: ${role.base};
      }
    `;
  }}
`;

const ContentWrapper = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const AlertTitle = styled.strong`
  display: block;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const Alert = ({
  variant = 'info',
  title,
  onClose,
  showIcon = true,
  children,
  ...rest
}: AlertProps) => {
  return (
    <AlertContainer $variant={variant} role="alert" {...rest}>
      {showIcon && <Icon name={variantIcons[variant]} size={20} />}
      <ContentWrapper>
        {title && <AlertTitle>{title}</AlertTitle>}
        <div>{children}</div>
      </ContentWrapper>
      {onClose && (
        <IconButton
          name="close"
          size="sm"
          variant="ghost"
          aria-label="Fermer"
          onClick={onClose}
        />
      )}
    </AlertContainer>
  );
};
