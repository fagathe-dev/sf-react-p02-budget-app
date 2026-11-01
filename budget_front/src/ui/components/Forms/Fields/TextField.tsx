import { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { FieldBaseProps } from '../form.types';
import { HelperText } from '../HelperText';
import { Input, InputProps } from '../Input';
import { Label } from '../Label';

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export interface TextFieldProps extends Omit<InputProps, 'id'>, FieldBaseProps {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, id: customId, ...inputProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const validationState = error ? 'invalid' : inputProps.validationState;

    return (
      <FieldWrapper>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        <Input ref={ref} id={id} required={required} validationState={validationState} {...inputProps} />
        {error && <HelperText state="invalid">{error}</HelperText>}
        {!error && hint && <HelperText>{hint}</HelperText>}
      </FieldWrapper>
    );
  }
);

TextField.displayName = 'TextField';
