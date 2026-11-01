import { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { HelperText } from '../HelperText';
import { Toggle, ToggleProps } from '../Toggle';

const LabelContainer = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  user-select: none;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
`;

const FieldWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export interface ToggleFieldProps extends ToggleProps {
  label: string;
  error?: string;
}

export const ToggleField = forwardRef<HTMLInputElement, ToggleFieldProps>(
  ({ label, error, id: customId, ...toggleProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <FieldWrapper>
        <LabelContainer htmlFor={id}>
          <Toggle ref={ref} id={id} {...toggleProps} />
          {label && <span>{label}</span>}
        </LabelContainer>
        {error && <HelperText state="invalid">{error}</HelperText>}
      </FieldWrapper>
    );
  }
);

ToggleField.displayName = 'ToggleField';
