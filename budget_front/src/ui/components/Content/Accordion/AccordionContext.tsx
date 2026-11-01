import React, { createContext, useContext, useState } from 'react';

export interface AccordionContextType {
  activeKeys: string[];
  toggleKey: (key: string) => void;
}

export const AccordionContext = createContext<AccordionContextType | null>(
  null
);

export const useAccordion = (): AccordionContextType => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an <Accordion>');
  }
  return context;
};

export interface AccordionProviderProps {
  children: React.ReactNode;
  multiple?: boolean;
  defaultActiveKeys?: string[];
}

export const AccordionProvider = ({
  children,
  multiple = false,
  defaultActiveKeys = [],
}: AccordionProviderProps) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(defaultActiveKeys);

  const toggleKey = (key: string) => {
    setActiveKeys((prev) => {
      const isOpen = prev.includes(key);
      if (multiple) {
        return isOpen ? prev.filter((k) => k !== key) : [...prev, key];
      }
      return isOpen ? [] : [key];
    });
  };

  return (
    <AccordionContext.Provider value={{ activeKeys, toggleKey }}>
      {children}
    </AccordionContext.Provider>
  );
};
