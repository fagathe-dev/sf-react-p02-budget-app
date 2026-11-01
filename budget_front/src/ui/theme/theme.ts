import { AppTheme } from '@/ui/types';
import { borders, breakpoints, getColors, getShadows, media, radii, spacing, typography } from './tokens';

export const lightTheme: AppTheme = {
  name: 'light',
  colors: getColors('light'),
  radii,
  spacing,
  typography,
  shadows: getShadows('light'),
  borders,
  breakpoints,
  media,
};

export const darkTheme: AppTheme = {
  name: 'dark',
  colors: getColors('dark'),
  radii,
  spacing,
  typography,
  shadows: getShadows('dark'),
  borders: {
    ...borders,
    focusRing: {
      ...borders.focusRing,
      color: '#93b387', // Olive-400 opaque en dark : 7,7:1 vs surface (WCAG >= 3:1)
    },
  },
  breakpoints,
  media,
};
