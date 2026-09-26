import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { RingPreview } from '@/components/dev/RingPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Ring');

export default function RingPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Ring"
      description="Dev-only preview of the countdown ring in every mode and stage."
    >
      <RingPreview />
    </DevPreviewShell>
  );
}
