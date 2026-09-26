import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { RevealPreview } from '@/components/dev/RevealPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Reveal');

export default function RevealPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Reveal"
      description="Dev-only preview of the found-player card on the squad grid."
    >
      <RevealPreview />
    </DevPreviewShell>
  );
}
