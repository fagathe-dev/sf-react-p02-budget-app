import { createAppTheme } from 'core-react/theme';

/**
 * Thème de l'app : identité du UI Kit de core-react (rôles, neutres, rayons du Design System).
 * `appTheme` (valeurs en var(--ds-…)) sert aux deux modes ; `lightTheme` / `darkTheme` restent disponibles.
 */
export const { lightTheme, darkTheme, theme: appTheme, cssVariables } = createAppTheme();
