import styled from 'styled-components';
import { BaseComponentProps } from '@/ui/types';


export const CardBody = styled.div<BaseComponentProps>`
  padding: ${({ theme }) => theme.spacing[4]};
  flex: 1 1 auto;
`;
