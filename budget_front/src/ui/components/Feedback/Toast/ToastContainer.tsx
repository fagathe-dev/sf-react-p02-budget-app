// frontend/src/ui/components/Feedback/Toast/ToastContainer.tsx
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Toast } from './Toast';
import { useToastStore } from './useToast';

const Viewport = styled.div`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2.5]};
  pointer-events: none;
`;

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0 || typeof document === 'undefined') return null;

  return createPortal(
    <Viewport aria-live="polite">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          title={t.title}
          onClose={() => removeToast(t.id)}
        >
          {t.message}
        </Toast>
      ))}
    </Viewport>,
    document.body
  );
};