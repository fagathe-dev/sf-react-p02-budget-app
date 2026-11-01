// frontend/src/ui/components/Navigation/Dropdown/DropdownMenu.tsx
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { useGenericDropdown } from './DropdownContext';

export interface DropdownMenuProps extends BaseComponentProps {
  align?: 'left' | 'right';
  minWidth?: string;
}

const MenuList = styled.ul<{
  $isOpen: boolean;
  $align: 'left' | 'right';
  $minWidth: string;
}>`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing[1]});
  ${({ $align }) => ($align === 'right' ? 'right: 0;' : 'left: 0;')}
  z-index: 950;
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  flex-direction: column;
  min-width: ${({ $minWidth }) => $minWidth};
  margin: 0;
  padding: ${({ theme }) => theme.spacing[1.5]};
  list-style: none;
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export const DropdownMenu = ({ align = 'right', minWidth = '180px', children, ...rest }: DropdownMenuProps) => {
  const { isOpen } = useGenericDropdown();

  return (
    <MenuList $isOpen={isOpen} $align={align} $minWidth={minWidth} role="menu" {...rest}>
      {children}
    </MenuList>
  );
};
