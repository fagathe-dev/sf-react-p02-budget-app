import React from 'react';

// Contrat de base universel
export interface BaseComponentProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: React.ElementType;
}

// Pour éléments interactifs / cliquables
export interface ClickableComponentProps extends BaseComponentProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
}

// Pour champs de formulaire (valeur contrôlée / changements)
export interface InputComponentProps<
  T = HTMLInputElement | HTMLTextAreaElement,
> extends BaseComponentProps {
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<T>) => void;
}

// Pour saisie continue et gestion clavier
export interface OnInputComponentProps<
  T = HTMLElement,
> extends BaseComponentProps {
  onInput?: (event: React.FormEvent<T>) => void;
  onKeyDown?: (event: React.KeyboardEvent<T>) => void;
  onKeyUp?: (event: React.KeyboardEvent<T>) => void;
}
