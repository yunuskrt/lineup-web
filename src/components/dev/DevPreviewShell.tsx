import type { ReactNode } from 'react';

type DevPreviewShellProps = {
  title: string;
  description: string;
  isNarrow?: boolean;
  children: ReactNode;
};

export function DevPreviewShell({
  title,
  description,
  isNarrow = false,
  children,
}: DevPreviewShellProps) {
  return (
    <main
      className={`mx-auto flex w-full flex-col gap-12 px-4 py-12 ${isNarrow ? 'max-w-4xl' : 'max-w-6xl'}`}
    >
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold">{title}</h1>
        <p className="text-14 text-fg-muted">{description}</p>
      </header>
      {children}
    </main>
  );
}
