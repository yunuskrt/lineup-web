'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState, type ReactNode } from 'react';
import { createQueryClient } from '@/components/providers/query-client';

type Props = {
  children: ReactNode;
};

const QueryProvider = ({ children }: Props) => {
  // One client per tab, never shared across requests
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
