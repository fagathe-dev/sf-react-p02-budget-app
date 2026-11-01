import { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { FieldBaseProps } from '../form.types';
import { HelperText } from '../HelperText';
import { Label } from '../Label';
import { Select, SelectProps } from '../Select';

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export interface ChoiceFieldProps extends Omit<SelectProps, 'id'>, FieldBaseProps {}

export const ChoiceField = forwardRef<HTMLSelectElement, ChoiceFieldProps>(
  ({ label, error, hint, required, id: customId, children, ...selectProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const validationState = error ? 'invalid' : selectProps.validationState;

    return (
      <FieldWrapper>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        <Select ref={ref} id={id} required={required} validationState={validationState} {...selectProps}>
          {children}
        </Select>
        {error && <HelperText state="invalid">{error}</HelperText>}
        {!error && hint && <HelperText>{hint}</HelperText>}
      </FieldWrapper>
    );
  }
);

ChoiceField.displayName = 'ChoiceField';
