import React from 'react';

type Props = LayoutProps<'/'>;

const GameLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-dvh flex-1 flex-col p-4">
      {/* The canvas owns quit, so a run can confirm */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};

export default GameLayout;
