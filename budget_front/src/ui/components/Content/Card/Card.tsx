import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { CardHeader } from './CardHeader';
import { CardTitle } from './CardTitle';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg';
  bordered?: boolean;
}

const StyledCard = styled.div<CardProps>`
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border-radius: ${({ theme }) => theme.radii.base};
  border: ${({ bordered = true, theme }) =>
    bordered ? `1px solid ${theme.colors.border.default}` : 'none'};
  box-shadow: ${({ elevation = 'sm', theme }) => theme.shadows[elevation]};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
`;

export const Card = Object.assign(StyledCard, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Title: CardTitle,
});
