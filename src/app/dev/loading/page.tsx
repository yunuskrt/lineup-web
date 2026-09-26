import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoadingPreview } from '@/components/dev/LoadingPreview';

export const metadata: Metadata = {
  title: 'Loading',
  robots: { index: false },
};

export default function LoadingPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold">Loading</h1>
        <p className="text-14 text-fg-muted">
          Dev-only preview of the squad skeleton and the canvas gate.
        </p>
      </header>
      <LoadingPreview />
    </main>
  );
}
