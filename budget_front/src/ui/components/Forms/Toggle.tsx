import styled from 'styled-components';

export interface ToggleProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  type?: 'checkbox' | 'radio';
}

export const Toggle = styled.input.attrs<ToggleProps>((props) => ({
  type: props.type || 'checkbox',
}))<ToggleProps>`
  appearance: none;
  position: relative;
  width: 2.5rem;
  height: 1.35rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  background-color: ${({ theme }) => theme.colors.border.default};
  outline: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  vertical-align: middle;
  margin: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: calc(1.35rem - 4px);
    height: calc(1.35rem - 4px);
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: transform 0.2s ease;
  }

  &:checked {
    background-color: ${({ theme }) => theme.colors.primary.base};

    &::after {
      transform: translateX(1.15rem);
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.base};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
