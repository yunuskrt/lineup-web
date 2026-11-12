import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { ProPreview } from '@/components/dev/ProPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Pro');

export default function ProPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Pro"
      description="Dev-only preview of the Pro lock and the /pro page in each plan."
    >
      <ProPreview />
    </DevPreviewShell>
  );
}
