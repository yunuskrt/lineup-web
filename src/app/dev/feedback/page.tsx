import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { FeedbackPreview } from '@/components/dev/FeedbackPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Feedback');

type Props = {};

const FeedbackPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Feedback"
      description="Dev-only preview of the already-found and not-in-XI channels."
    >
      <FeedbackPreview />
    </DevPreviewShell>
  );
};

export default FeedbackPreviewPage;
