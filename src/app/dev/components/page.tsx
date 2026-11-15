import { ComponentsPreview } from '@/components/dev/ComponentsPreview';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Components');

export default function ComponentsPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Components"
      description="Dev-only preview of src/components/ui, restyled from neobrutalism.dev."
    >
      <ComponentsPreview />
    </DevPreviewShell>
  );
}
