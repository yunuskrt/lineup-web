export default function GameLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col p-4">
      {/* The canvas owns quit, so a run can confirm */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
