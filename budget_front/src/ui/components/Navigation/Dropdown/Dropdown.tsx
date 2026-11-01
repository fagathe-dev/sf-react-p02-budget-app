// frontend/src/ui/components/Navigation/Dropdown/Dropdown.tsx
import { BaseComponentProps, ClickableComponentProps } from '@/ui/types';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GenericDropdownContext, useGenericDropdown } from './DropdownContext';
import { DropdownDivider, DropdownItem } from './DropdownItem';
import { DropdownMenu } from './DropdownMenu';

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const TriggerButton = styled.div`
  display: inline-flex;
  cursor: pointer;
`;

export const DropdownTrigger = ({ children, onClick, ...rest }: ClickableComponentProps) => {
  const { isOpen, toggle } = useGenericDropdown();

  return (
    <TriggerButton
      onClick={(e) => {
        onClick?.(e);
        toggle();
      }}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      {...rest}
    >
      {children}
    </TriggerButton>
  );
};

const DropdownRoot = ({ children, ...rest }: BaseComponentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const onOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <GenericDropdownContext.Provider value={{ isOpen, toggle, close }}>
      <Wrapper ref={ref} {...rest}>
        {children}
      </Wrapper>
    </GenericDropdownContext.Provider>
  );
};

export const Dropdown = Object.assign(DropdownRoot, {
  Trigger: DropdownTrigger,
  Menu: DropdownMenu,
  Item: DropdownItem,
  Divider: DropdownDivider,
});
