import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const ModalFooter = styled.footer<BaseComponentProps>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2.5]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
`;
