import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const SidebarSection = styled.span<BaseComponentProps>`
  display: block;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  margin-top: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted ?? theme.colors.text.body};
  opacity: 0.7;
  user-select: none;
`;
