export const breakpoints = {
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px',
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// Helpers pour media queries dans styled-components
export const media = {
  up: (key: BreakpointKey) => `@media (min-width: ${breakpoints[key]})`,
  down: (key: BreakpointKey) => `@media (max-width: ${breakpoints[key]})`,
} as const;
