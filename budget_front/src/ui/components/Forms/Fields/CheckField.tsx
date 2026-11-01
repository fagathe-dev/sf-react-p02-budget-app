import React, { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { Checkbox } from '../Checkbox';
import { HelperText } from '../HelperText';
import { Radio } from '../Radio';

const LabelContainer = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  user-select: none;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.body};
`;

const FieldWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export interface CheckFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  type?: 'checkbox' | 'radio';
  error?: string;
}

export const CheckField = forwardRef<HTMLInputElement, CheckFieldProps>(
  ({ label, type = 'checkbox', error, id: customId, ...inputProps }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const InputComponent = type === 'radio' ? Radio : Checkbox;

    return (
      <FieldWrapper>
        <LabelContainer htmlFor={id}>
          <InputComponent ref={ref} id={id} {...inputProps} />
          {label && <span>{label}</span>}
        </LabelContainer>
        {error && <HelperText state="invalid">{error}</HelperText>}
      </FieldWrapper>
    );
  }
);

CheckField.displayName = 'CheckField';
