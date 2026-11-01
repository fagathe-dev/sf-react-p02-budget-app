import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { useTabs } from './TabsContext';

const ContentWrapper = styled.div`
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

export interface TabContentProps extends BaseComponentProps {
  value: string;
}

export const TabContent = ({ value, children, ...rest }: TabContentProps) => {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return (
    <ContentWrapper role="tabpanel" {...rest}>
      {children}
    </ContentWrapper>
  );
};
