import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { ProPreview } from '@/components/dev/ProPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Pro');

type Props = {};

const ProPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Pro"
      description="Dev-only preview of the Pro lock and the /pro page in each plan."
    >
      <ProPreview />
    </DevPreviewShell>
  );
};

export default ProPreviewPage;
