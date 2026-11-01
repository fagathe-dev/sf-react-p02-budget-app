import styled from 'styled-components';
import { BaseComponentProps } from '@/ui/types';

export const CardFooter = styled.footer<BaseComponentProps>`
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
`;

