import { createContext, useContext } from 'react';

export interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const TabsContext = createContext<TabsContextType | null>(null);

export const useTabs = (): TabsContextType => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a <Tabs>');
  }
  return context;
};
