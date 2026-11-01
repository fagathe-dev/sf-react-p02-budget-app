import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';

export const NavbarBrand = styled.div<BaseComponentProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.heading};
  text-decoration: none;
  user-select: none;
`;
