import { describe, expect, it } from 'vitest';
import { truncateWords } from './string';
 
const FALLBACK = 'Aucun contenu…';
 
describe('truncateWords', () => {
  it.each([null, undefined, ''])('retourne le texte par défaut pour %p', (value) => {
    expect(truncateWords(value)).toBe(FALLBACK);
  });
 
  it('retourne le texte tel quel s’il ne dépasse pas la limite', () => {
    expect(truncateWords('un deux trois', 5)).toBe('un deux trois');
  });
 
  it('retourne le texte tel quel s’il fait exactement maxWords mots', () => {
    expect(truncateWords('un deux trois', 3)).toBe('un deux trois');
  });
 
  it('tronque au nombre de mots demandé et ajoute des points de suspension', () => {
    expect(truncateWords('un deux trois quatre cinq', 3)).toBe('un deux trois…');
  });
 
  it('utilise 100 mots par défaut', () => {
    const text = Array.from({ length: 150 }, (_, i) => `mot${i}`).join(' ');
    const result = truncateWords(text);
 
    expect(result.endsWith('…')).toBe(true);
    expect(result.slice(0, -1).split(' ')).toHaveLength(100);
  });
 
  it('traite espaces multiples, tabulations et retours à la ligne comme des séparateurs', () => {
    expect(truncateWords('un  deux\n\ntrois\tquatre', 2)).toBe('un deux…');
  });
 
  it('ignore les espaces en début et fin de texte pour le comptage', () => {
    expect(truncateWords('  un deux trois  ', 2)).toBe('un deux…');
  });
});