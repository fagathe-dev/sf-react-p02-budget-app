import { BaseComponentProps } from '@/ui/types';

export type TextAlign = 'start' | 'center' | 'end';

export type SemanticColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'muted';

export interface TypoBaseProps extends BaseComponentProps {
  align?: TextAlign;
  color?: SemanticColor;
}
