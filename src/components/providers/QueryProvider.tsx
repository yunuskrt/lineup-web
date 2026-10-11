'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { shouldRetryQuery } from '@/lib/api/retry';

type QueryProviderProps = {
  children: ReactNode;
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetryQuery },
      // A guess or sign-up is never sent twice
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: QueryProviderProps) {
  // One client per tab, never shared across requests
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
