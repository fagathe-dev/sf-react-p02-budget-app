import { Icon } from '@/ui/components/Base/Icon';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { useAccordionItem } from './AccordionItemContext';

const StyledTriggerButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} 0`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.heading};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.base};
  }

  & > i {
    transition: transform 0.2s ease;
    transform: ${({ $isOpen }) =>
      $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

export const AccordionTrigger = ({ children, ...rest }: BaseComponentProps) => {
  const { isOpen, toggle } = useAccordionItem();

  return (
    <StyledTriggerButton
      type="button"
      $isOpen={isOpen}
      onClick={toggle}
      aria-expanded={isOpen}
      {...rest}
    >
      <span>{children}</span>
      <Icon name="chevron-down" size={18} />
    </StyledTriggerButton>
  );
};
