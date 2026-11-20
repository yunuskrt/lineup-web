import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { RingPreview } from '@/components/dev/RingPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Ring');

type Props = {};

const RingPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Ring"
      description="Dev-only preview of the countdown ring in every mode and stage."
    >
      <RingPreview />
    </DevPreviewShell>
  );
};

export default RingPreviewPage;
