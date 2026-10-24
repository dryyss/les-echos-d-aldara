/** Nombre de lignes maximum d'une boîte de dialogue. */
export const DIALOGUE_LINES = 3;

/**
 * Coupe un texte en lignes d'au plus `maxChars` caractères, sur les espaces.
 * Un mot plus long que la ligne est coupé brutalement.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ')) {
      if (word === '') continue;
      if (current === '') {
        current = word;
      } else if (current.length + 1 + word.length <= maxChars) {
        current = `${current} ${word}`;
      } else {
        lines.push(current);
        current = word;
      }
      while (current.length > maxChars) {
        lines.push(current.slice(0, maxChars));
        current = current.slice(maxChars);
      }
    }
    lines.push(current);
  }
  return lines;
}

/** Regroupe des lignes en pages de `linesPerPage` lignes. */
export function paginate(lines: string[], linesPerPage = DIALOGUE_LINES): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

/** Découpe une réplique en pages prêtes à afficher. */
export function layoutDialogue(text: string, maxChars: number): string[][] {
  return paginate(wrapText(text, maxChars));
}

/** Formate une durée en « 1 h 05 » ou « 12 min ». */
export function formatPlayTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')}`;
}

/** Formate un nombre de pièces avec séparateur d'espace fine. */
export function formatCoins(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} p.`;
}
