import React, { type ReactNode } from 'react';
import { FILTER_CHIP } from '@/styles/classes';

type Props = {
  isPressed: boolean;
  onClick: () => void;
  image?: ReactNode;
  children: ReactNode;
};

const Chip = ({ isPressed, onClick, image, children }: Props) => {
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      onClick={onClick}
      className={`${FILTER_CHIP} group inline-flex items-center gap-2`}
    >
      {image}
      {children}
    </button>
  );
};

export default Chip;
