// src/utils/string.ts (ou directement dans le composant)
export const truncateWords = (
  text: string | null | undefined,
  maxWords = 100
): string => {
  if (!text) return 'Aucun contenu…';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}…`;
};
