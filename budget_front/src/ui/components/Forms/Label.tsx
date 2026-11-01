import styled from 'styled-components';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = styled.label<LabelProps>`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.heading};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  cursor: pointer;

  ${({ required, theme }) =>
    required &&
    `
    &::after {
      content: ' *';
      color: ${theme.colors.danger.base};
    }
  `}
`;
