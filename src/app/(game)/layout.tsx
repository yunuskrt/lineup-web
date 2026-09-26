import { QuitChip } from '@/components/shell/QuitChip';

export default function GameLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col gap-4 p-4">
      {/* Phones get the chip in the canvas header row */}
      <div className="hidden justify-end sm:flex">
        <QuitChip />
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
