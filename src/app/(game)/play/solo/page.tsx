import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solo',
};

export default function SoloPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-line">
      <h1 className="text-14 text-fg-muted">Solo game</h1>
    </div>
  );
}
