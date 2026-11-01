// src/ui/components/Navigation/ThemeModeSwitcher.tsx
import { ThemePreference, useTheme } from '@/hooks/useTheme';
import { SegmentedControl, SegmentedControlProps, SegmentedOption } from '@/ui/components/Base';
import React from 'react';

const ICON_ONLY_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', icon: 'laptop', title: 'Système (suit le réglage de votre appareil)' },
  { value: 'light', icon: 'white-balance-sunny', title: 'Thème clair' },
  { value: 'dark', icon: 'weather-night', title: 'Thème sombre' },
];

type ThemeModeSwitcherProps = Pick<SegmentedControlProps<ThemePreference>, 'fullWidth' | 'size'>;

/** Choix du mode d'affichage : Système, Clair ou Sombre. */
export const ThemeModeSwitcher: React.FC<ThemeModeSwitcherProps> = ({ ...props }) => {
  const { preference, setPreference } = useTheme();

  return (
    <SegmentedControl
      aria-label="Mode d'affichage"
      options={ICON_ONLY_OPTIONS}
      value={preference}
      onChange={setPreference}
      {...props}
    />
  );
};
