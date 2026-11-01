import { ClickableComponentProps } from '@/ui/types';
import styled, { css } from 'styled-components';

export interface ListGroupItemProps extends ClickableComponentProps {
  active?: boolean;
  action?: boolean;
}

export const ListGroupItem = styled.li.attrs<ListGroupItemProps>((props) => ({
  as: props.as || (props.onClick ? 'button' : 'li'),
}))<ListGroupItemProps>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[2.5]} ${theme.spacing[3.5]}`};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-top-width: 0;
  text-align: inherit;
  cursor: ${({ action, onClick }) =>
    action || onClick ? 'pointer' : 'default'};
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:first-child {
    border-top-width: 1px;
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
  }

  &:last-child {
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
  }

  ${({ action, onClick, theme }) =>
    (action || onClick) &&
    css`
      &:hover:not(:disabled) {
        background-color: ${theme.colors.background.surfaceHover};
      }
    `}

  ${({ active, theme }) =>
    active &&
    css`
      z-index: 2;
      color: ${theme.colors.white};
      background-color: ${theme.colors.primary.base} !important;
      border-color: ${theme.colors.primary.base} !important;
    `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  }
`;
