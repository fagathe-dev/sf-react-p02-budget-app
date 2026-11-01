export type ValidationState = 'default' | 'valid' | 'invalid';

export interface FormElementBaseProps {
  validationState?: ValidationState;
}

export interface FieldBaseProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
}
