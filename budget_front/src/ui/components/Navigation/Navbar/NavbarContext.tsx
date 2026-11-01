import { BreakPointType } from 'core-ts';
import { createContext, useContext } from 'react';

export interface NavbarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  breakpoint?: BreakPointType;
}

export const NavbarContext = createContext<NavbarContextType | null>(null);

export const useNavbar = (): NavbarContextType => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error(
      'Les sous-composants Navbar doivent être utilisés dans <Navbar>'
    );
  }
  return context;
};
