import type { Metadata } from 'next';
import { connection } from 'next/server';
import { PlayScreen } from '@/components/play/PlayScreen';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Play',
};

export default async function PlayPage() {
  // Renders per request so the screen reads the URL
  await connection();

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <h1 className="sr-only">Play</h1>
      <PlayScreen />
    </div>
  );
}
