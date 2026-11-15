import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Our text-12…72 are sizes, not colours
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        '12',
        '14',
        '16',
        '20',
        '24',
        '28',
        '30',
        '32',
        '34',
        '40',
        '48',
        '64',
        '72',
      ],
      shadow: ['hard', 'hard-sm'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
