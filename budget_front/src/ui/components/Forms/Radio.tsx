import { styled } from 'styled-components';

export const Radio = styled.input.attrs({ type: 'radio' })`
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background.surface};
  display: inline-grid;
  place-content: center;
  margin: 0;
  cursor: pointer;
  vertical-align: middle;

  &::before {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    transform: scale(0);
    transition: transform 120ms ease-in-out;
    background-color: ${({ theme }) => theme.colors.white};
  }

  &:checked {
    background-color: ${({ theme }) => theme.colors.primary.base};
    border-color: ${({ theme }) => theme.colors.primary.base};
    &::before {
      transform: scale(1);
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.base};
    outline-offset: 2px;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
