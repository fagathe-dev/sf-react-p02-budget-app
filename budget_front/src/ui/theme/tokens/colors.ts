export const palettes = {
  olive: {
    50: '#f7f9f6',
    100: '#ebf1e9',
    200: '#d6e2d1',
    300: '#b7ceae',
    400: '#93b387',
    500: '#739566',
    600: '#58774c',
    700: '#465f3e',
    800: '#394d33',
    900: '#30402b',
    950: '#182315',
  },
  taupe: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172b',
    950: '#020617',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
} as const;

export const staticColors = {
  white: '#ffffff',
  black: '#000000',
} as const;

// Création des alias sémantiques dynamiques (Light vs Dark)
const createSemanticRole = (
  palette: (typeof palettes)[keyof typeof palettes],
  isDark: boolean
) => ({
  scale: palette,
  base: isDark ? palette[500] : palette[600],
  hover: isDark ? palette[400] : palette[700],
  subtle: isDark ? palette[900] : palette[100],
  dark: isDark ? palette[300] : palette[800],
  emphasis: isDark ? palette[100] : palette[950],
});

export const getColors = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  return {
    ...staticColors,
    palettes,
    primary: createSemanticRole(palettes.olive, isDark),
    secondary: createSemanticRole(palettes.taupe, isDark),
    tertiary: createSemanticRole(palettes.slate, isDark),
    success: createSemanticRole(palettes.green, isDark),
    warning: createSemanticRole(palettes.amber, isDark),
    info: createSemanticRole(palettes.blue, isDark),
    danger: createSemanticRole(palettes.red, isDark),

    // Tokens de surface et texte
    text: {
      body: isDark ? palettes.slate[200] : palettes.slate[800],
      muted: isDark ? palettes.slate[400] : palettes.slate[500],
      heading: isDark ? palettes.slate[50] : palettes.slate[950],
    },
    background: {
      body: isDark ? palettes.slate[950] : palettes.neutral[50],
      surface: isDark ? palettes.slate[900] : staticColors.white,
      // Sombre : #283548 (entre slate 800 et 700) = survol visible (1,44:1 vs surface)
      // tout en gardant le texte muted à 4,84:1 (>= 4,5:1)
      surfaceHover: isDark ? '#283548' : palettes.slate[50],
      surfaceActive: isDark ? palettes.slate[700] : palettes.slate[100],
    },
    border: {
      // Séparation des composants (cartes, séparateurs) : sombre 1,72:1 vs surface
      default: isDark ? palettes.slate[700] : palettes.slate[200],
      hover: isDark ? palettes.slate[600] : palettes.slate[300],
      // Contour des éléments interactifs (champs, boutons outline) : >= 3:1 (WCAG 1.4.11)
      strong: palettes.slate[500],
    },
  };
};