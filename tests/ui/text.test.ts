import { describe, expect, it } from 'vitest';
import { formatPlayTime, layoutDialogue, paginate, wrapText } from '../../src/ui/text';

describe('wrapText', () => {
  it('coupe sur les espaces sans dépasser la largeur', () => {
    const lines = wrapText('Debout, l’apprenti ! Le soleil t’a battu.', 20);
    expect(lines).toEqual(['Debout, l’apprenti !', 'Le soleil t’a battu.']);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(20);
  });

  it('coupe un mot trop long', () => {
    expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('respecte les retours à la ligne explicites', () => {
    expect(wrapText('un\ndeux trois', 10)).toEqual(['un', 'deux trois']);
  });

  it('gère la chaîne vide et les points de suspension', () => {
    expect(wrapText('', 10)).toEqual(['']);
    expect(wrapText('…', 10)).toEqual(['…']);
  });
});

describe('paginate', () => {
  it('regroupe par 3 lignes', () => {
    expect(paginate(['a', 'b', 'c', 'd'])).toEqual([['a', 'b', 'c'], ['d']]);
    expect(paginate([])).toEqual([[]]);
  });
});

describe('layoutDialogue', () => {
  it('tient en une page pour une réplique de 120 caractères sur 40 colonnes', () => {
    const text =
      'Il me manque du minerai pour la commande du meunier. Va en chercher au fond du village, près du vieux puits.';
    const pages = layoutDialogue(text, 40);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.length).toBeLessThanOrEqual(3);
  });
});

describe('formatPlayTime', () => {
  it('affiche minutes puis heures', () => {
    expect(formatPlayTime(12 * 60_000)).toBe('12 min');
    expect(formatPlayTime(65 * 60_000)).toBe('1 h 05');
  });
});
