'use client';

import React, { type ReactNode } from 'react';
import Image from 'next/image';
import { useImageFallback } from '@/hooks/use-image-fallback';

// Box is 20px; 40 covers 2x screens
const IMAGE_PX = 40;

type Props = {
  src: string | null;
  fallback: ReactNode;
};

const FilterChipImage = ({ src, fallback }: Props) => {
  const { showsImage, onError } = useImageFallback(src);

  return (
    <span aria-hidden="true" className="flex size-5 shrink-0">
      {showsImage && src ? (
        <Image
          src={src}
          alt=""
          width={IMAGE_PX}
          height={IMAGE_PX}
          unoptimized
          onError={onError}
          className="size-full object-contain"
        />
      ) : (
        fallback
      )}
    </span>
  );
};

export default FilterChipImage;
