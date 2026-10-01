'use client';

import { useState } from 'react';

// Falls back once per source; a new source retries
export function useImageFallback(src: string | null) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return {
    showsImage: src !== null && src !== failedSrc,
    onError: () => setFailedSrc(src),
  };
}
