import { BaseComponentProps } from '@/ui/types';
import { useId } from 'react';
import styled from 'styled-components';
import { useAccordion } from './AccordionContext';
import { AccordionItemContext } from './AccordionItemContext';

const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export interface AccordionItemProps extends BaseComponentProps {
  itemKey?: string;
}

export const AccordionItem = ({
  itemKey,
  children,
  ...rest
}: AccordionItemProps) => {
  const autoKey = useId();
  const key = itemKey || autoKey;

  const { activeKeys, toggleKey } = useAccordion();
  const isOpen = activeKeys.includes(key);

  const itemContextValue = {
    itemKey: key,
    isOpen,
    toggle: () => toggleKey(key),
  };

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <ItemWrapper {...rest}>{children}</ItemWrapper>
    </AccordionItemContext.Provider>
  );
};
