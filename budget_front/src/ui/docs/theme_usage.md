# Documentation du Thème et Design System

Ce document explique comment utiliser le système de thème (clair/sombre) et les design tokens (espacements, couleurs, typographie) dans l'application React (Admin). 

Le système repose sur **styled-components** pour le rendu CSS et **Zustand** pour la gestion de l'état du thème.

---

## 1. Initialisation du Thème (Setup)

L'application doit être enveloppée par le `ThemeProvider` de `styled-components` et inclure les styles globaux (`GlobalStyle`). Le hook `useTheme` se charge de fournir le bon objet de thème (clair ou sombre) en fonction des préférences de l'utilisateur.

```tsx
// Exemple d'intégration dans src/App.tsx (ou main.tsx)
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '@/ui/theme/GlobalStyle';
import { useTheme } from '@/hooks'; // Via le forwarding de src/hooks/index.ts

export const App = ({ children }: { children: React.ReactNode }) => {
  // Le hook gère la persistance (localStorage) et la synchronisation du DOM (data-theme)
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};
```

---

## 2. Basculer entre les thèmes (Le Hook `useTheme`)

L'utilisateur a trois choix : **Clair**, **Sombre** ou **Auto**. En mode Auto, l'application suit le réglage de l'appareil / du navigateur (`prefers-color-scheme`), y compris en direct quand il change. Par défaut, le choix est `Auto`.

Le hook `useTheme` expose :

* `preference` : le choix de l'utilisateur, `'light' | 'dark' | 'system'` (persisté dans le `localStorage`, clé `ds-app-theme`).
* `mode` : le thème réellement appliqué, `'light' | 'dark'` (jamais `'system'`).
* `isDark` : raccourci pour `mode === 'dark'`.
* `setPreference(preference)` : change le choix. `setMode` en est un alias conservé pour compatibilité.
* `toggleTheme()` : bascule clair <-> sombre à partir du thème appliqué et fixe un choix explicite.

Pour proposer les trois choix à l'utilisateur, utilisez le composant `ThemeModeSwitcher` (boutons segmentés, accessible au clavier) :

```tsx
import { ThemeModeSwitcher } from '@/ui/components/Navigation/ThemeModeSwitcher';

// Pleine largeur (ex. menu du compte) ; `size="sm"` pour une version compacte
<ThemeModeSwitcher fullWidth />
```

Pour lire ou piloter le thème dans un composant :

```tsx
import { useTheme } from '@/hooks';

export const ThemeInfo = () => {
  const { mode, preference, isDark, setPreference } = useTheme();

  return (
    <div>
      <p>Choix : {preference} / Thème appliqué : {mode}</p>
      {isDark && <p>Le mode sombre est actif.</p>}

      {/* Pour forcer un choix, ou revenir au réglage système */}
      <button onClick={() => setPreference('light')}>Forcer Light</button>
      <button onClick={() => setPreference('system')}>Suivre le système</button>
    </div>
  );
};
```

`SegmentedControl` (`@/ui/components/Base/SegmentedControl`) est le composant générique sous-jacent : `options`, `value`, `onChange`, `aria-label` (obligatoire), `fullWidth`, `size` (`'sm' | 'md'`) et `showCheck`.

---

## 3. Utiliser les Design Tokens dans les composants

L'interface `AppTheme` est injectée automatiquement dans les props des composants stylisés. Ne **jamais** utiliser de valeurs en dur (hexadécimal, pixels) pour les couleurs, marges ou polices.

```tsx
import styled from 'styled-components';

export const StyledCard = styled.div`
  /* Couleurs de fond et de texte contextuelles (s'adaptent au mode clair/sombre) */
  background-color: ${({ theme }) => theme.colors.background.surface};
  color: ${({ theme }) => theme.colors.text.body};

  /* Bordures et ombres */
  border: ${({ theme }) => theme.borders.widths.thin} solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  /* Espacements (0.5rem, 1rem, etc.) */
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  /* Typographie */
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.base};

  /* Interactions (Hover, Focus) */
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    border-color: ${({ theme }) => theme.colors.border.hover};
  }

  &:focus-visible {
    outline: ${({ theme }) => `${theme.borders.focusRing.width} solid ${theme.borders.focusRing.color}`};
    outline-offset: ${({ theme }) => theme.borders.focusRing.offset};
  }

  /* Responsive (Media Queries via helpers) */
  ${({ theme }) => theme.media.up('md')} {
    padding: ${({ theme }) => theme.spacing[8]};
  }
`;
```

---

## 4. Architecture des Couleurs

Les couleurs sont divisées en deux concepts pour faciliter le mode sombre :

1.  **Les Palettes Brutes (`theme.colors.palettes.*`) :** Échelles de 50 à 950 (ex: `olive`, `slate`, `taupe`). À utiliser avec parcimonie, uniquement si vous avez besoin d'une nuance spécifique qui ne doit pas changer avec le thème.
2.  **Les Rôles Sémantiques (`theme.colors.primary`, `success`, `danger`, etc.) :** C'est la méthode recommandée. Chaque rôle expose des alias qui s'inversent intelligemment en mode sombre :
    *   `.base` : Couleur principale (ex: bouton).
    *   `.hover` : Couleur au survol.
    *   `.subtle` : Version très claire (fond d'alerte).
    *   `.dark` : Version foncée (texte sur fond subtle).
    *   `.emphasis` : Version pour un contraste fort.

```tsx
const Alert = styled.div`
  background-color: ${({ theme }) => theme.colors.danger.subtle};
  color: ${({ theme }) => theme.colors.danger.dark};
  border: 1px solid ${({ theme }) => theme.colors.danger.base};
`;
```