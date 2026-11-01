import { BaseComponentProps } from '@/ui/types';
import { useState } from 'react';
import styled from 'styled-components';
import { TabsContext } from './TabsContext';

const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
`;

export interface TabsProps extends BaseComponentProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({ defaultValue = '', value, onValueChange, children, ...rest }: TabsProps) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);

  const activeTab = value !== undefined ? value : internalValue;
  const setActiveTab = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <TabsRoot {...rest}>{children}</TabsRoot>
    </TabsContext.Provider>
  );
};
