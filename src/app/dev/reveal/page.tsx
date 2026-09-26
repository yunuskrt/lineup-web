import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RevealPreview } from '@/components/dev/RevealPreview';

export const metadata: Metadata = {
  title: 'Reveal',
  robots: { index: false },
};

export default function RevealPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold">Reveal</h1>
        <p className="text-14 text-fg-muted">
          Dev-only preview of the found-player card on the squad grid.
        </p>
      </header>
      <RevealPreview />
    </main>
  );
}
