// frontend/src/ui/components/Feedback/Drawer/Drawer.tsx
import { BaseComponentProps } from '@/ui/types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { DrawerBody, DrawerFooter, DrawerHeader } from './DrawerSubcomponents';

export type DrawerPlacement = 'right' | 'left';

export interface DrawerProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: DrawerPlacement;
  width?: string;
  closeOnBackdrop?: boolean;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1050;
  background-color: rgba(12, 10, 9, 0.5);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const Panel = styled.aside<{ $placement: DrawerPlacement; $width: string }>`
  position: fixed;
  top: 0;
  bottom: 0;
  ${({ $placement }) => ($placement === 'right' ? 'right: 0;' : 'left: 0;')}
  z-index: 1051;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $width }) => $width};
  background-color: ${({ theme }) => theme.colors.background.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border-left: ${({ $placement, theme }) =>
    $placement === 'right' ? `1px solid ${theme.colors.border.default}` : 'none'};
  border-right: ${({ $placement, theme }) =>
    $placement === 'left' ? `1px solid ${theme.colors.border.default}` : 'none'};

  ${({ $placement }) => css`
    animation: ${keyframes`
      from { transform: translateX(${$placement === 'right' ? '100%' : '-100%'}); }
      to { transform: translateX(0); }
    `} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `}
`;

const DrawerRoot = ({
  isOpen,
  onClose,
  placement = 'right',
  width = '420px',
  closeOnBackdrop = true,
  children,
  ...rest
}: DrawerProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <Backdrop
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <Panel $placement={placement} $width={width} role="dialog" aria-modal="true" {...rest}>
        {children}
      </Panel>
    </Backdrop>,
    document.body
  );
};

export const Drawer = Object.assign(DrawerRoot, {
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
});
