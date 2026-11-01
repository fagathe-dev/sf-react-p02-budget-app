import { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { FieldBaseProps } from '../form.types';
import { HelperText } from '../HelperText';
import { Label } from '../Label';
import { Textarea, TextareaProps } from '../Textarea';

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export interface TextareaFieldProps extends Omit<TextareaProps, 'id'>, FieldBaseProps {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, id: customId, rows = 3, ...textareaProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const validationState = error ? 'invalid' : textareaProps.validationState;

    return (
      <FieldWrapper>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        <Textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          validationState={validationState}
          {...textareaProps}
        />
        {error && <HelperText state="invalid">{error}</HelperText>}
        {!error && hint && <HelperText>{hint}</HelperText>}
      </FieldWrapper>
    );
  }
);

TextareaField.displayName = 'TextareaField';
