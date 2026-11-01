import { createContext, useContext } from 'react';

export interface AccordionItemContextType {
  itemKey: string;
  isOpen: boolean;
  toggle: () => void;
}

export const AccordionItemContext =
  createContext<AccordionItemContextType | null>(null);

export const useAccordionItem = (): AccordionItemContextType => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('useAccordionItem must be used within an <AccordionItem>');
  }
  return context;
};
