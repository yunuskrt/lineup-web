import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { LivesPreview } from '@/components/dev/LivesPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Lives');

export default function LivesPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Lives"
      description="Dev-only preview of the lives display, the life-lost flash and the rail's Lives card."
    >
      <LivesPreview />
    </DevPreviewShell>
  );
}
