import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { RevealPreview } from '@/components/dev/RevealPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Reveal');

type Props = {};

const RevealPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Reveal"
      description="Dev-only preview of the found-player card on the squad grid."
    >
      <RevealPreview />
    </DevPreviewShell>
  );
};

export default RevealPreviewPage;
