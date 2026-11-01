export const getShadows = (mode: 'light' | 'dark') => {
  if (mode === 'dark') {
    return {
      // Une ombre noire est invisible sur fond quasi noir : on ajoute un anneau blanc
      // très translucide (liseré lumineux) qui détache la carte, + l'ombre douce pour la profondeur.
      none: 'none',
      sm: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      base: '0 4px 15px -3px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      md: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.07)',
      lg: '0 20px 40px -5px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.09)',
      inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
    };
  }

  return {
    none: 'none',
    sm: '0 1px 3px rgba(15, 23, 43, 0.04), 0 1px 2px rgba(15, 23, 43, 0.02)',
    base: '0 4px 15px -3px rgba(15, 23, 43, 0.06), 0 4px 6px -4px rgba(15, 23, 43, 0.03)',
    md: '0 10px 25px -5px rgba(15, 23, 43, 0.08), 0 8px 10px -6px rgba(15, 23, 43, 0.04)',
    lg: '0 20px 40px -5px rgba(15, 23, 43, 0.12), 0 10px 20px -5px rgba(15, 23, 43, 0.06)',
    inset: 'inset 0 2px 4px 0 rgba(15, 23, 43, 0.04)',
  };
};
