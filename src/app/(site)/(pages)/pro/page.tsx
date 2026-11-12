import type { Metadata } from 'next';
import { ProScreen } from '@/components/pro/ProScreen';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Pro',
};

export default function ProPage() {
  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <ProScreen />
    </div>
  );
}
