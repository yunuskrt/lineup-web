import { guessTextSchema } from '@/lib/api/schemas/common';

export function prepareGuess(raw: string): string | null {
  const parsed = guessTextSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
