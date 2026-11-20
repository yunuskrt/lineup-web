import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { SoundPreview } from '@/components/dev/SoundPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Sound');

type Props = {};

const SoundPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Sound"
      description="Dev-only preview of every gameplay sound cue and the mute toggle."
    >
      <SoundPreview />
    </DevPreviewShell>
  );
};

export default SoundPreviewPage;
