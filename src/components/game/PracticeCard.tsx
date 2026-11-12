// Where the ring and the lives sit in a timed run
export function PracticeCard() {
  return (
    <section
      aria-label="Practice"
      className="flex flex-col gap-1 rounded-md border border-line bg-surface-card p-3 lg:p-4"
    >
      <h2 className="font-display text-20 leading-7 font-semibold">Practice</h2>
      <p className="text-14 leading-5 text-fg-muted">
        No clock and no lives. Name all eleven, or quit when you like. This run
        isn&apos;t saved.
      </p>
    </section>
  );
}
