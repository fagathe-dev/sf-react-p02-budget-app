import { BaseComponentProps } from '@/ui/types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(12, 10, 9, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  animation: ${fadeIn} 0.15s ease-out;
`;

const ContentPanel = styled.div<{ $maxWidth: string }>`
  position: relative;
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${popIn} 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
`;

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
}

export const ModalRoot = ({
  isOpen,
  onClose,
  maxWidth = '520px',
  closeOnBackdrop = true,
  children,
  ...rest
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <Backdrop
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <ContentPanel
        $maxWidth={maxWidth}
        role="dialog"
        aria-modal="true"
        {...rest}
      >
        {children}
      </ContentPanel>
    </Backdrop>,
    document.body
  );
};

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
