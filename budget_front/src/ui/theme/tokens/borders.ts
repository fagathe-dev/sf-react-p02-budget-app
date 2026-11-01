export interface Borders {
  widths: {
    none: '0px';
    thin: '1px';
    thick: '2px';
  };
  focusRing: {
    width: '3px';
    offset: '2px';
    color: string; // Permet d'accepter n'importe quelle couleur RGBA
  };
}

export const borders: Borders = {
  widths: {
    none: '0px',
    thin: '1px',
    thick: '2px',
  },
  focusRing: {
    width: '3px',
    offset: '2px',
    color: '#58774c', // Olive-600 opaque : 5,05:1 vs blanc (l'ancien rgba 0.3 = 1,49:1)
  },
};
