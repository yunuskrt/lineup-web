import React from 'react';
import { authErrorMessageOf } from '@/lib/auth';

type Props = {
  error: unknown;
  // Hidden while a retry is under way
  isBusy: boolean;
};

const StartError = ({ error, isBusy }: Props) => {
  if (!error || isBusy) return null;
  return (
    <p role="alert" className="text-14 text-danger-text">
      {authErrorMessageOf(error)}
    </p>
  );
};

export default StartError;
