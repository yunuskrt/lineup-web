import { QuitChip } from '@/components/shell/QuitChip';

export default function GameLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col gap-4 p-4">
      <div className="flex justify-end">
        <QuitChip />
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
