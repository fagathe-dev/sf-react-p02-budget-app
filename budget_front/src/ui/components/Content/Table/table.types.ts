import { BaseComponentProps } from "@/ui/types";

export type CellAlign = 'left' | 'center' | 'right';

export interface CellProps extends BaseComponentProps {
  align?: CellAlign;
  width?: string | number;
}
