import React from 'react';
import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { GuessPreview } from '@/components/dev/GuessPreview';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';

export const metadata = devMetadata('Guess');

type Props = {};

const GuessPreviewPage = ({}: Props) => {
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Guess"
      description="Dev-only preview of the guess input and its statuses."
    >
      <GuessPreview />
    </DevPreviewShell>
  );
};

export default GuessPreviewPage;
