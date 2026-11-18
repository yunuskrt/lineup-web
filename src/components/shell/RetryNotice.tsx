import React, { type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import StateNotice from '@/components/shell/StateNotice';
import { SECONDARY_BUTTON } from '@/styles/classes';

type Props = {
  message: ReactNode;
  onRetry: () => void;
  title?: string;
  titleLevel?: 1 | 2 | 3;
};

const RetryNotice = ({ message, onRetry, title, titleLevel }: Props) => (
  <StateNotice
    tone="error"
    icon={TriangleAlert}
    title={title}
    titleLevel={titleLevel}
    message={message}
  >
    <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
      Try again
    </button>
  </StateNotice>
);

export default RetryNotice;
