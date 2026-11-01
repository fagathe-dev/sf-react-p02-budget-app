import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { useAccordionItem } from './AccordionItemContext';

const ContentWrapper = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  padding-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.text.body};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

export const AccordionContent = ({ children, ...rest }: BaseComponentProps) => {
  const { isOpen } = useAccordionItem();

  return (
    <ContentWrapper $isOpen={isOpen} {...rest}>
      {children}
    </ContentWrapper>
  );
};
