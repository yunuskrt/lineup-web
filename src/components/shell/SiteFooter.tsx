import { SITE_CONTAINER } from '@/styles/classes';

type SiteFooterProps = {
  variant: 'statement' | 'inline';
};

export function SiteFooter({ variant }: SiteFooterProps) {
  if (variant === 'statement') {
    return (
      <footer className="border-t border-line">
        <p
          className={`${SITE_CONTAINER} py-16 font-display text-24 font-bold uppercase font-stretch-expanded sm:text-32`}
        >
          Know the XI. Beat the Clock.
        </p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-line">
      <p className={`${SITE_CONTAINER} py-6 text-12 text-fg-muted`}>
        Lineup — Know the XI. Beat the Clock.
      </p>
    </footer>
  );
}
