import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { slotLayout } from '@/lib/formation';
import type { RevealedPlayer } from '@/types/player';

export const metadata: Metadata = {
  title: 'Pitch',
  robots: { index: false },
};

const FORMATIONS = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
  '4-1-2-1-2',
];

// Long and accented names sit in midfield slots, where lines run five wide
const SAMPLE_NAMES = [
  'Gareth Pennock',
  'Dean Harlow',
  "Ciarán O'Donovan",
  'Stuart Fenwick',
  'Rhys Harlow',
  'Christophe Delacroix-Morel',
  'Íñigo Castañeda',
  'Jasper van der Linde',
  'Kofi Addo-Mensah',
  'Tavinho',
  'Wes Tolland',
];

const PARTIAL_SLOTS = new Set([0, 3, 5, 9]);

function samplePlayers(formation: string, isFull: boolean): RevealedPlayer[] {
  const points = slotLayout(formation) ?? [];

  return points
    .filter((point) => isFull || PARTIAL_SLOTS.has(point.slot))
    .map((point) => ({
      id: `sample-${point.slot}`,
      name: SAMPLE_NAMES[point.slot],
      slot: point.slot,
      position: point.position,
      imageUrl: null,
    }));
}

type SpecimenProps = {
  label: string;
  formation: string;
  revealed: RevealedPlayer[];
};

function Specimen({ label, formation, revealed }: SpecimenProps) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-12 text-fg-muted">{label}</figcaption>
      <div className="h-120 rounded-lg border border-line p-2">
        <SquadGrid formation={formation} revealed={revealed} />
      </div>
    </figure>
  );
}

export default function PitchPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-32 font-semibold">Pitch</h1>
        <p className="text-14 text-fg-muted">
          Dev-only preview of the squad grid in every fixture formation.
        </p>
      </header>
      {FORMATIONS.map((formation) => (
        <section key={formation} className="flex flex-col gap-4">
          <h2 className="font-display text-20 font-semibold">{formation}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Specimen label="0 of 11" formation={formation} revealed={[]} />
            <Specimen
              label="4 of 11"
              formation={formation}
              revealed={samplePlayers(formation, false)}
            />
            <Specimen
              label="11 of 11"
              formation={formation}
              revealed={samplePlayers(formation, true)}
            />
          </div>
        </section>
      ))}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-20 font-semibold">Invalid</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Specimen label="4-4-3" formation="4-4-3" revealed={[]} />
        </div>
      </section>
    </main>
  );
}
