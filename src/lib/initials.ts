function firstLetter(word: string): string {
  const [letter = ''] = Array.from(word);
  return letter.toUpperCase();
}

export function initials(name: string): string {
  const words = name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const first = firstLetter(words[0]);
  if (words.length === 1) return first;

  return first + firstLetter(words[words.length - 1]);
}
