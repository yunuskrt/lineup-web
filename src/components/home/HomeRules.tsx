import { SITE_CONTAINER } from '@/styles/classes';

const RULES = [
  { count: 11, text: 'Starters to name, from one team in one real match.' },
  { count: 15, text: 'Seconds a turn. Name a new player to end it.' },
  {
    count: 3,
    text: 'Lives. Only the clock takes one. A wrong name just costs time.',
  },
];

export function HomeRules() {
  return (
    <section aria-labelledby="home-rules" className="border-t border-line">
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-rules" className="sr-only">
          How it plays
        </h2>
        <dl className="max-w-2xl border-b border-line">
          {RULES.map((rule) => (
            <div
              key={rule.count}
              className="flex items-baseline gap-6 border-t border-line py-5"
            >
              <dt className="w-12 shrink-0 text-right font-display text-32 font-bold tabular-nums">
                {rule.count}
              </dt>
              <dd className="text-16 text-fg-muted sm:text-20">{rule.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-16 text-fg-muted">
          Play solo, or take someone on live in a 1v1 duel.
        </p>
      </div>
    </section>
  );
}
