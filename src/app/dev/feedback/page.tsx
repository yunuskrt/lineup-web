import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { FeedbackPreview } from '@/components/dev/FeedbackPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Feedback');

export default function FeedbackPreviewPage() {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Feedback"
      description="Dev-only preview of the already-found and not-in-XI channels."
    >
      <FeedbackPreview />
    </DevPreviewShell>
  );
}
