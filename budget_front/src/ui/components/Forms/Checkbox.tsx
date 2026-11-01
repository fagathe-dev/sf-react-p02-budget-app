import styled from 'styled-components';

export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.background.surface};
  display: inline-grid;
  place-content: center;
  margin: 0;
  cursor: pointer;
  vertical-align: middle;

  &::before {
    content: '';
    width: 0.65rem;
    height: 0.65rem;
    transform: scale(0);
    transition: transform 120ms ease-in-out;
    background-color: ${({ theme }) => theme.colors.white};
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
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
    border-color: ${({ theme }) => theme.colors.border.default};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
