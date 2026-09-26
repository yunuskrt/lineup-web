import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function devMetadata(title: string): Metadata {
  return { title, robots: { index: false } };
}

export function requireDevEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
}
