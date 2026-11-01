import 'styled-components';
import {
  type Borders,
  breakpoints,
  getColors,
  getShadows,
  media,
  radii,
  spacing,
  typography,
} from '@/ui/theme/tokens';

export interface AppTheme {
  name: 'light' | 'dark';
  colors: ReturnType<typeof getColors>;
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: ReturnType<typeof getShadows>;
  borders: Borders;
  breakpoints: typeof breakpoints;
  media: typeof media;
}

// Augmentation de module pour styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
