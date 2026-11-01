import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const ModalBody = styled.div<BaseComponentProps>`
  padding: ${({ theme }) => theme.spacing[4]};
  overflow-y: auto;
  max-height: calc(85vh - 120px);
  color: ${({ theme }) => theme.colors.text.body};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;
