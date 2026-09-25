import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Duel',
};

export default function DuelPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-line">
      <h1 className="text-14 text-fg-muted">Duel</h1>
    </div>
  );
}
