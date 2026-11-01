import { BaseComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';
import { useTabs } from './TabsContext';

const TriggerButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1.5]};
  padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[3.5]}`};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.semibold : theme.typography.weights.medium};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary.base : theme.colors.text.muted)};
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.heading};
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background-color: ${theme.colors.primary.base};
        border-radius: ${theme.radii.pill};
      }
    `}
`;

export interface TabTriggerProps extends BaseComponentProps {
  value: string;
  disabled?: boolean;
}

export const TabTrigger = ({ value, disabled = false, children, ...rest }: TabTriggerProps) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <TriggerButton
      type="button"
      role="tab"
      aria-selected={isActive}
      $active={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      {...rest}
    >
      {children}
    </TriggerButton>
  );
};
