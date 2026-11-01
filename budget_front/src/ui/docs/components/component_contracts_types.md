# Contrats de Types et Création de Composants

Ce document définit les règles et contrats à respecter lors de la création de nouveaux composants UI dans l'application React.

Afin de garantir l'uniformité des propriétés (props) à travers tout le Design System et de s'assurer du bon support de l'accessibilité ou des événements, tout nouveau composant doit étendre l'une des interfaces définies dans le module `@/ui/types/components.types.ts`.

## 1. Les Contrats Disponibles

*   `BaseComponentProps` : Interface racine. À utiliser pour les éléments structurels simples (ex: Box, Container, Typography).
    *   Fournit : `id`, `className`, `style`, `children`, `as` (pour le polymorphisme).
*   `ClickableComponentProps` : À utiliser pour les boutons, liens, ou tout élément avec lequel l'utilisateur interagit par un clic.
    *   Ajoute : `onClick`, `disabled`, `tabIndex`, `role`, `'aria-label'`.
*   `InputComponentProps<T>` : À utiliser pour les champs de formulaire contrôlés (text, select, checkbox).
    *   Ajoute : `name`, `value`, `defaultValue`, `disabled`, `readOnly`, `required`, `onChange`.
*   `OnInputComponentProps<T>` : À utiliser pour la saisie continue et la gestion des événements clavier.
    *   Ajoute : `onInput`, `onKeyDown`, `onKeyUp`.

## 2. Exemple Complet : Création d'un Composant UI

Voici la structure de référence pour créer un composant stylisé qui respecte nos standards d'architecture (Forward Ref, typage strict, styled-components).

```tsx
import React from 'react';
import styled from 'styled-components';
import { ClickableComponentProps } from '@/ui/types';

// 1. Définition des props en étendant le bon contrat
export interface ButtonProps extends ClickableComponentProps {
  /** Variante visuelle du bouton */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Rendre le bouton occupant 100% de la largeur */
  fullWidth?: boolean;
}

// 2. Création de la coquille stylisée
const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  
  /* Utilisation des espacements et bordures du thème */
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.base};
  border: ${({ theme }) => theme.borders.widths.thin} solid transparent;
  
  /* Typographie */
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  /* Gestion des variantes via les rôles sémantiques de couleurs */
  ${({ theme, variant }) => {
    switch (variant) {
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary.subtle};
          color: ${theme.colors.secondary.dark};
          border-color: ${theme.colors.border.default};
          &:hover:not(:disabled) { background-color: ${theme.colors.secondary.base}; color: ${theme.colors.staticColors.white}; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.danger.base};
          color: ${theme.colors.staticColors.white};
          &:hover:not(:disabled) { background-color: ${theme.colors.danger.hover}; }
        `;
      case 'primary':
      default:
        return `
          background-color: ${theme.colors.primary.base};
          color: ${theme.colors.staticColors.white};
          &:hover:not(:disabled) { background-color: ${theme.colors.primary.hover}; }
        `;
    }
  }}

  /* États globaux */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: ${({ theme }) => `${theme.borders.focusRing.width} solid ${theme.borders.focusRing.color}`};
    outline-offset: ${({ theme }) => theme.borders.focusRing.offset};
  }
`;

// 3. Implémentation du composant avec React.forwardRef
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', fullWidth = false, ...props }, ref) => {
    return (
      <StyledButton 
        ref={ref} 
        variant={variant} 
        fullWidth={fullWidth} 
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';
```