import { BreakPointType } from 'core-ts';
import React, { createContext, useContext, useState } from 'react';

export interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  breakpoint?: BreakPointType;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error(
      'Les sous-composants Sidebar doivent être utilisés dans <SidebarProvider> ou <Sidebar>'
    );
  }
  return context;
};

export interface SidebarProviderProps {
  children: React.ReactNode;
  breakpoint?: BreakPointType;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  breakpoint = 'md',
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalIsOpen(next);
    onToggle?.(next);
  };

  const close = () => {
    if (!isControlled) setInternalIsOpen(false);
    onToggle?.(false);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, breakpoint }}>
      {children}
    </SidebarContext.Provider>
  );
};
