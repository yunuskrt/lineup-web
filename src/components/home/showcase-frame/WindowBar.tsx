import React from 'react';

const WINDOW_DOTS = ['close', 'minimise', 'zoom'];

type Props = {};

// A browser window's top bar, drawn, not real
const WindowBar = ({}: Props) => {
  return (
    <div className="flex items-center gap-1.5 rounded-t-[inherit] border-b-2 border-line bg-surface-card px-3 py-2">
      {WINDOW_DOTS.map((dot) => (
        <span
          key={dot}
          className="size-2.5 rounded-full border-2 border-line"
        />
      ))}
      <span className="ml-2 h-4 w-full max-w-40 rounded-full border-2 border-line bg-surface" />
    </div>
  );
};

export default WindowBar;
