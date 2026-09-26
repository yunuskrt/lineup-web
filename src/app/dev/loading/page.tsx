import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { LoadingPreview } from '@/components/dev/LoadingPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Loading');

export default function LoadingPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Loading"
      description="Dev-only preview of the squad skeleton and the canvas gate."
    >
      <LoadingPreview />
    </DevPreviewShell>
  );
}
