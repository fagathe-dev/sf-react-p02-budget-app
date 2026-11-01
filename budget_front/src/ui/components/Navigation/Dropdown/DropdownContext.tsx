// frontend/src/ui/components/Navigation/Dropdown/DropdownContext.tsx
import { createContext, useContext } from 'react';

export interface DropdownContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const GenericDropdownContext =
  createContext<DropdownContextValue | null>(null);

export const useGenericDropdown = (): DropdownContextValue => {
  const ctx = useContext(GenericDropdownContext);
  if (!ctx) {
    throw new Error('Doit être utilisé à l’intérieur d’un <Dropdown>');
  }
  return ctx;
};