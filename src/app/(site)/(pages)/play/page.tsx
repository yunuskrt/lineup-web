import type { Metadata } from 'next';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Play',
};

export default function PlayPage() {
  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <h1 className="font-display text-32 font-bold">Play</h1>
    </div>
  );
}
