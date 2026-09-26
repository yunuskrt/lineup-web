import { DevPreviewShell } from '@/components/dev/DevPreviewShell';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { devMetadata, requireDevEnv } from '@/lib/dev/route';
import { samplePlayer } from '@/lib/dev/samples';
import { slotLayout } from '@/lib/formation';
import type { RevealedPlayer } from '@/types/player';

export const metadata = devMetadata('Pitch');

const FORMATIONS = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
  '4-1-2-1-2',
];

const PARTIAL_SLOTS = new Set([0, 3, 5, 9]);

function samplePlayers(formation: string, isFull: boolean): RevealedPlayer[] {
  const points = slotLayout(formation) ?? [];

  return points
    .filter((point) => isFull || PARTIAL_SLOTS.has(point.slot))
    .map((point) => samplePlayer(formation, point.slot));
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
  requireDevEnv();

  return (
    <DevPreviewShell
      title="Pitch"
      description="Dev-only preview of the squad grid in every fixture formation."
    >
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
    </DevPreviewShell>
  );
}
