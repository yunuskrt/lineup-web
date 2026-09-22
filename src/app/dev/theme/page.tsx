import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ResolvedValue } from '@/components/dev/ResolvedValue';
import {
  COLOR_PRIMITIVES,
  COLOR_ROLES,
  COUNTDOWN_SAMPLE,
  LATIN_EXTENDED_SAMPLE,
  RADIUS_SCALE,
  SPACING_SCALE,
  TYPE_SCALE,
} from '@/app/dev/theme/theme-preview';

export const metadata: Metadata = {
  title: 'Theme',
  robots: { index: false },
};

type SectionProps = {
  title: string;
  children: ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-20 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

type SwatchProps = {
  className: string;
  label: string;
  detail: string;
  variable: string;
};

function Swatch({ className, label, detail, variable }: SwatchProps) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-raised">
      <div className={`h-16 border-b border-line ${className}`} />
      <div className="flex flex-col gap-1 p-3">
        <span className="text-14 font-medium">{label}</span>
        <span className="font-mono text-12 text-fg-muted">{detail}</span>
        <ResolvedValue variable={variable} />
      </div>
    </div>
  );
}

function PrimitivesSection() {
  return (
    <Section title="Primitives">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {COLOR_PRIMITIVES.map((primitive) => (
          <Swatch
            key={primitive.name}
            className={primitive.className}
            label={primitive.name}
            detail={primitive.variable}
            variable={primitive.variable}
          />
        ))}
      </div>
    </Section>
  );
}

function RolesSection() {
  return (
    <Section title="Roles">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {COLOR_ROLES.map((role) => (
          <Swatch
            key={role.role}
            className={role.className}
            label={role.role}
            detail={`→ ${role.primitive}`}
            variable={`--${role.role}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
        <p className="text-fg">fg — primary text</p>
        <p className="text-fg-muted">fg-muted — labels, metadata</p>
        <p className="text-fg-dim">fg-dim — placeholders, disabled</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <span className="rounded-sm bg-brand px-3 py-2 text-14 font-medium text-on-accent">
          on-accent on brand
        </span>
        <span className="rounded-sm bg-found px-3 py-2 text-14 font-medium text-on-accent">
          on-accent on found
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border-2 border-you p-4 font-display text-16 font-semibold text-you">
          You
        </div>
        <div className="rounded-md border-2 border-opponent p-4 font-display text-16 font-semibold text-opponent">
          Opponent
        </div>
      </div>
    </Section>
  );
}

function TypeSection() {
  return (
    <Section title="Type">
      <div className="flex flex-col gap-6">
        {TYPE_SCALE.map((step) => (
          <div key={step.className} className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-12 text-fg-muted">
              {step.className} · {step.rem}
              {step.use ? ` · ${step.use}` : ''}
            </span>
            <p className={`wrap-break-word font-sans ${step.className}`}>
              {LATIN_EXTENDED_SAMPLE}
            </p>
            <p className={`wrap-break-word font-display ${step.className}`}>
              {LATIN_EXTENDED_SAMPLE}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-6">
        <span className="font-mono text-12 text-fg-muted">
          Archivo normal / expanded
        </span>
        <p className="font-display text-32 font-semibold">Lineup</p>
        <p className="font-display text-32 font-semibold font-stretch-expanded">
          Lineup
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-12 text-fg-muted">
          Player name — Inter Medium
        </span>
        <p className="font-sans text-16 font-medium">{LATIN_EXTENDED_SAMPLE}</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-12 text-fg-muted">
          Countdown — tabular-nums
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-display text-64 tabular-nums">
          {COUNTDOWN_SAMPLE.map((second) => (
            <span key={second}>{second}</span>
          ))}
        </div>
      </div>
    </Section>
  );
}

function SpacingSection() {
  return (
    <Section title="Spacing">
      <div className="flex flex-col gap-2">
        {SPACING_SCALE.map((step) => (
          <div key={step.px} className="flex items-center gap-4">
            <span className="w-12 font-mono text-12 text-fg-muted">
              {step.px}px
            </span>
            <div className={`h-4 bg-marking ${step.className}`} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function RadiusSection() {
  return (
    <Section title="Radius">
      <div className="flex flex-wrap gap-6">
        {RADIUS_SCALE.map((step) => (
          <div key={step.className} className="flex flex-col gap-2">
            <div
              className={`h-16 w-16 border border-line bg-surface-card ${step.className}`}
            />
            <span className="font-mono text-12 text-fg-muted">
              {step.className} · {step.value}
            </span>
            <span className="text-12 text-fg-dim">{step.use}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function ThemePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold">Theme</h1>
        <p className="text-14 text-fg-muted">
          Dev-only preview of tokens.css and theme.css.
        </p>
      </header>
      <PrimitivesSection />
      <RolesSection />
      <TypeSection />
      <SpacingSection />
      <RadiusSection />
    </main>
  );
}
