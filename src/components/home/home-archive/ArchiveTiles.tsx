'use client';

import React from 'react';
import {
  CalendarRange,
  type LucideIcon,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import CountUp from '@/components/home/CountUp';
import {
  CORNER,
  LABEL_BOX,
  TILE,
  TILES,
} from '@/components/home/home-archive/styles';
import { useEntrance } from '@/hooks/use-entrance';
import { archiveFigures } from '@/lib/landing';
import { TYPE_NUMBER } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

const FIGURE_ICONS: Record<string, LucideIcon> = {
  matches: Trophy,
  players: Users,
  sides: Shield,
  seasons: CalendarRange,
};

type Props = { overview: CatalogOverview };

const ArchiveTiles = ({ overview }: Props) => {
  const { ref, item } = useEntrance<HTMLDListElement>();

  return (
    <dl ref={ref} className={TILES}>
      {archiveFigures(overview).map((figure, index) => {
        const Icon = FIGURE_ICONS[figure.key] ?? Trophy;
        return (
          <motion.div key={figure.key} className={TILE} {...item(index)}>
            <span aria-hidden="true" className={CORNER}>
              <Icon className="size-4.5" strokeWidth={2.25} />
            </span>
            <dt
              className={`order-last text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6 ${LABEL_BOX}`}
            >
              {figure.label}
            </dt>
            {/* A dl group holds only dt and dd */}
            <dd
              className={`text-32 leading-10 sm:text-48 sm:leading-15 ${TYPE_NUMBER}`}
            >
              <CountUp value={figure.value} />
            </dd>
          </motion.div>
        );
      })}
    </dl>
  );
};

export default ArchiveTiles;
